#!/usr/bin/env python3
import json

# Cargar GeoJSON
with open('FINCAS_MARVIC_FINAL.geojson', 'r') as f:
    data = json.load(f)

# Generar SQL para upsert de parcelas
sql_lines = []
sql_lines.append('-- =============================================')
sql_lines.append('-- SQL PARA SINCRONIZAR PARCELAS MARVIC')
sql_lines.append('-- Fecha: 2026-04-12')
sql_lines.append('-- Total parcelas a sincronizar: {}'.format(len(data['features'])))
sql_lines.append('-- =============================================')
sql_lines.append('')
sql_lines.append('-- PASO 1: Verificar parcelas actuales en BD')
sql_lines.append('SELECT farm, COUNT(*) as parcelas_actuales FROM public.parcels GROUP BY farm ORDER BY farm;')
sql_lines.append('')
sql_lines.append('-- PASO 2: UPSERT de todas las parcelas desde GeoJSON')
sql_lines.append('-- NOTA: company_id usa el valor por defecto (00000000-0000-0000-0000-000000000001)')
sql_lines.append('')

# Agrupar por finca para mejor legibilidad
fincas = {}
for feature in data['features']:
    p = feature['properties']
    finca = p['finca']
    if finca not in fincas:
        fincas[finca] = []
    fincas[finca].append(p)

# Generar INSERTs por finca
for finca in sorted(fincas.keys()):
    sql_lines.append(f'-- === {finca} ({len(fincas[finca])} parcelas) ===')
    sql_lines.append('')
    
    for p in fincas[finca]:
        # Mapear campos
        parcel_id = p['parcel_id']
        farm = p['finca'].upper().replace("'", "''")  # Escapar comillas
        parcel_number = p['parcela'].replace("'", "''")
        code = p['codigo']
        area = p['superficie']
        riego = p['riego'].lower()
        
        # Mapear tipo de riego a enum
        if riego == 'goteo':
            irrigation_enum = 'goteo'
        elif riego == 'tradicional':
            irrigation_enum = 'tradicional'
        elif riego == 'aspersion':
            irrigation_enum = 'aspersion'
        else:
            irrigation_enum = 'goteo'  # default
        
        sql = f"""INSERT INTO public.parcels (
    parcel_id, farm, parcel_number, code, area_hectares, 
    irrigation_type_v2, status, tipo_suelo, ph_suelo, 
    materia_organica_pct, ultima_analisis_suelo, company_id
) VALUES (
    '{parcel_id}', 
    '{farm}', 
    '{parcel_number}', 
    '{code}', 
    {area}, 
    '{irrigation_enum}'::tipo_riego,
    'vacia'::estado_parcela,
    NULL,
    NULL,
    NULL,
    NULL,
    '00000000-0000-0000-0000-000000000001'
)
ON CONFLICT (parcel_id) 
DO UPDATE SET
    farm = EXCLUDED.farm,
    parcel_number = EXCLUDED.parcel_number,
    code = EXCLUDED.code,
    area_hectares = EXCLUDED.area_hectares,
    irrigation_type_v2 = EXCLUDED.irrigation_type_v2;"""
        
        sql_lines.append(sql)
        sql_lines.append('')

# Agregar resumen final
sql_lines.append('-- =============================================')
sql_lines.append('-- PASO 3: Verificación post-actualización')
sql_lines.append('-- =============================================')
sql_lines.append('')
sql_lines.append('SELECT')
sql_lines.append('    farm,')
sql_lines.append('    COUNT(*) as total_parcelas,')
sql_lines.append('    SUM(area_hectares) as superficie_total_ha')
sql_lines.append('FROM public.parcels')
sql_lines.append('GROUP BY farm')
sql_lines.append('ORDER BY farm;')
sql_lines.append('')
sql_lines.append('-- Verificar parcelas vacías (listas para usar)')
sql_lines.append("SELECT parcel_id, farm, parcel_number, area_hectares")
sql_lines.append('FROM public.parcels')
sql_lines.append("WHERE status = 'vacia'::estado_parcela")
sql_lines.append('ORDER BY farm, parcel_number;')

# Guardar SQL
with open('sincronizar_parcelas.sql', 'w') as f:
    f.write('\n'.join(sql_lines))

print('✔ SQL generado: sincronizar_parcelas.sql')
print(f'✔ Total parcelas procesadas: {len(data["features"])}')
print(f'✔ Fincas encontradas: {len(fincas)}')
for finca, parcelas in sorted(fincas.items()):
    print(f'  - {finca}: {len(parcelas)} parcelas')
