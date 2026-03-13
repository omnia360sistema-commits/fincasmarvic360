drop extension if exists "pg_net";


  create table "public"."parcel_production" (
    "parcel_id" text not null,
    "crop" text,
    "area_hectares" numeric,
    "estimated_production_kg" numeric,
    "estimated_plastic_kg" numeric,
    "estimated_drip_meters" numeric,
    "estimated_cost" numeric
      );


alter table "public"."harvests" add column "harvest_cost" numeric;

alter table "public"."harvests" add column "price_kg" numeric;

CREATE INDEX idx_harvests_parcel_id ON public.harvests USING btree (parcel_id);

CREATE INDEX idx_parcel_production ON public.parcel_production USING btree (parcel_id);

CREATE INDEX idx_plantings_parcel_id ON public.plantings USING btree (parcel_id);

CREATE INDEX idx_residuos_parcel_id ON public.residuos_operacion USING btree (parcel_id);

CREATE INDEX idx_work_records_parcel_id ON public.work_records USING btree (parcel_id);

CREATE UNIQUE INDEX parcel_production_pkey ON public.parcel_production USING btree (parcel_id);

alter table "public"."parcel_production" add constraint "parcel_production_pkey" PRIMARY KEY using index "parcel_production_pkey";

grant delete on table "public"."parcel_production" to "anon";

grant insert on table "public"."parcel_production" to "anon";

grant references on table "public"."parcel_production" to "anon";

grant select on table "public"."parcel_production" to "anon";

grant trigger on table "public"."parcel_production" to "anon";

grant truncate on table "public"."parcel_production" to "anon";

grant update on table "public"."parcel_production" to "anon";

grant delete on table "public"."parcel_production" to "authenticated";

grant insert on table "public"."parcel_production" to "authenticated";

grant references on table "public"."parcel_production" to "authenticated";

grant select on table "public"."parcel_production" to "authenticated";

grant trigger on table "public"."parcel_production" to "authenticated";

grant truncate on table "public"."parcel_production" to "authenticated";

grant update on table "public"."parcel_production" to "authenticated";

grant delete on table "public"."parcel_production" to "service_role";

grant insert on table "public"."parcel_production" to "service_role";

grant references on table "public"."parcel_production" to "service_role";

grant select on table "public"."parcel_production" to "service_role";

grant trigger on table "public"."parcel_production" to "service_role";

grant truncate on table "public"."parcel_production" to "service_role";

grant update on table "public"."parcel_production" to "service_role";


