-- FASE 0 — Auditoría previa (ejecutar en SQL Editor / psql ANTES de aplicar la migración)
-- Pegar resultados en el registro de despliegue antes de continuar.

SELECT COUNT(*) AS total FROM public.logistica_mantenimiento;

SELECT
  COUNT(*) FILTER (WHERE camion_id IS NOT NULL) AS con_camion,
  COUNT(*) FILTER (WHERE vehiculo_tipo IS NOT NULL) AS con_tipo,
  COUNT(*) FILTER (WHERE camion_id IS NULL AND vehiculo_tipo IS NULL) AS sin_camion_ni_tipo
FROM public.logistica_mantenimiento;

SELECT vehiculo_tipo, COUNT(*) AS n
FROM public.logistica_mantenimiento
GROUP BY vehiculo_tipo
ORDER BY n DESC;

-- Filas que la migración intentaría mover: tipo empresa/vehículo y camion_id válido en vehiculos_empresa
SELECT m.id, m.fecha, m.vehiculo_tipo, m.camion_id
FROM public.logistica_mantenimiento m
WHERE m.vehiculo_tipo IN ('vehiculo_empresa', 'vehiculo')
  AND m.camion_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.vehiculos_empresa v WHERE v.id = m.camion_id);

-- Posible inconsistencia: marca empresa pero id NO está en vehiculos_empresa (no se migrará automático)
SELECT m.id, m.fecha, m.vehiculo_tipo, m.camion_id
FROM public.logistica_mantenimiento m
WHERE m.vehiculo_tipo IN ('vehiculo_empresa', 'vehiculo')
  AND m.camion_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.vehiculos_empresa v WHERE v.id = m.camion_id)
  AND NOT EXISTS (SELECT 1 FROM public.camiones c WHERE c.id = m.camion_id);
