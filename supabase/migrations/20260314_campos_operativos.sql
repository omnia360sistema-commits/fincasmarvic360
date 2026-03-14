-- REGISTRO ESTADO PARCELA

create table if not exists registros_estado_parcela (
id uuid primary key default gen_random_uuid(),
parcel_id uuid references parcels(id) on delete cascade,
fecha timestamp default now(),
estado text,
cultivo text,
observaciones text
);

-- FOTOS DE CAMPO

create table if not exists fotos_campo (
id uuid primary key default gen_random_uuid(),
parcel_id uuid references parcels(id) on delete cascade,
fecha timestamp default now(),
url_imagen text,
descripcion text
);

-- VUELOS DE DRON

create table if not exists vuelos_dron (
id uuid primary key default gen_random_uuid(),
parcel_id uuid references parcels(id) on delete cascade,
fecha_vuelo timestamp,
url_imagen text,
observaciones text
);

-- ANALISIS DE SUELO

create table if not exists analisis_suelo (
id uuid primary key default gen_random_uuid(),
parcel_id uuid references parcels(id) on delete cascade,
fecha timestamp default now(),
ph numeric,
materia_organica numeric,
observaciones text
);

-- LECTURAS SENSOR PLANTA

create table if not exists lecturas_sensor_planta (
id uuid primary key default gen_random_uuid(),
parcel_id uuid references parcels(id) on delete cascade,
fecha timestamp default now(),
indice_salud numeric,
nivel_estres numeric,
observaciones text
);
