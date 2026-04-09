SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict v2BNJYI0Tgon2X5SQEYiuqYW3wRjadArepFcdHWagYK7SZ3qzjFU0EoqYpRzNJC

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") FROM stdin;
\.


--
-- Data for Name: custom_oauth_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."custom_oauth_providers" ("id", "provider_type", "identifier", "name", "client_id", "client_secret", "acceptable_client_ids", "scopes", "pkce_enabled", "attribute_mapping", "authorization_params", "enabled", "email_optional", "issuer", "discovery_url", "skip_nonce_check", "cached_discovery", "discovery_cached_at", "authorization_url", "token_url", "userinfo_url", "jwks_uri", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."flow_state" ("id", "user_id", "auth_code", "code_challenge_method", "code_challenge", "provider_type", "provider_access_token", "provider_refresh_token", "created_at", "updated_at", "authentication_method", "auth_code_issued_at", "invite_token", "referrer", "oauth_client_state_id", "linking_target_id", "email_optional") FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") FROM stdin;
00000000-0000-0000-0000-000000000000	bb9faa60-fbd8-44ef-9421-94554431ad64	authenticated	authenticated	sergio@agricolamarvic.com	$2a$10$RzFRNzfJjEbiA1CyZSrgZOzGLMCe4a34kv9Xd9ojqyAmp6fDntrea	2026-04-06 10:30:49.092191+00	\N		\N		\N			\N	2026-04-09 16:47:41.214846+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-06 10:30:49.04019+00	2026-04-09 16:47:41.24215+00	\N	\N			\N		0	\N		\N	f	\N	f
00000000-0000-0000-0000-000000000000	710b5e6a-d270-455a-9287-a46e43ebfc13	authenticated	authenticated	omnia360.sistema@gmail.com	$2a$10$enjJDscCchH0joK3Lo6G4.KNPf5CTjbLACWHIv0sCqjstXkk4fZ2W	2026-04-05 00:48:06.589541+00	\N		\N		\N			\N	2026-04-09 16:49:42.627736+00	{"provider": "email", "providers": ["email"]}	{"email_verified": true}	\N	2026-04-05 00:48:06.544373+00	2026-04-09 16:49:42.63645+00	\N	\N			\N		0	\N		\N	f	\N	f
\.


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") FROM stdin;
710b5e6a-d270-455a-9287-a46e43ebfc13	710b5e6a-d270-455a-9287-a46e43ebfc13	{"sub": "710b5e6a-d270-455a-9287-a46e43ebfc13", "email": "omnia360.sistema@gmail.com", "email_verified": false, "phone_verified": false}	email	2026-04-05 00:48:06.570563+00	2026-04-05 00:48:06.570643+00	2026-04-05 00:48:06.570643+00	c7e908cb-43c9-428f-826d-4757057e93ef
bb9faa60-fbd8-44ef-9421-94554431ad64	bb9faa60-fbd8-44ef-9421-94554431ad64	{"sub": "bb9faa60-fbd8-44ef-9421-94554431ad64", "email": "sergio@agricolamarvic.com", "email_verified": false, "phone_verified": false}	email	2026-04-06 10:30:49.072148+00	2026-04-06 10:30:49.072805+00	2026-04-06 10:30:49.072805+00	7e0afce2-5ba4-4d27-8699-b9df087bf735
\.


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."instances" ("id", "uuid", "raw_base_config", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_clients" ("id", "client_secret_hash", "registration_type", "redirect_uris", "grant_types", "client_name", "client_uri", "logo_uri", "created_at", "updated_at", "deleted_at", "client_type", "token_endpoint_auth_method") FROM stdin;
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sessions" ("id", "user_id", "created_at", "updated_at", "factor_id", "aal", "not_after", "refreshed_at", "user_agent", "ip", "tag", "oauth_client_id", "refresh_token_hmac_key", "refresh_token_counter", "scopes") FROM stdin;
9874be8e-83fc-4b63-a800-079bb2b15a7d	bb9faa60-fbd8-44ef-9421-94554431ad64	2026-04-07 14:59:08.776517+00	2026-04-09 16:45:59.063155+00	\N	aal1	\N	2026-04-09 16:45:59.062452	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0	188.247.171.99	\N	\N	\N	\N	\N
32372579-6375-45b1-90e8-bcc782a80129	bb9faa60-fbd8-44ef-9421-94554431ad64	2026-04-09 16:47:41.214939+00	2026-04-09 16:47:41.214939+00	\N	aal1	\N	\N	Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:149.0) Gecko/20100101 Firefox/149.0	188.247.171.99	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_amr_claims" ("session_id", "created_at", "updated_at", "authentication_method", "id") FROM stdin;
9874be8e-83fc-4b63-a800-079bb2b15a7d	2026-04-07 14:59:08.784262+00	2026-04-07 14:59:08.784262+00	password	4596984a-a8dc-4c10-965b-c73c4e1acc8a
32372579-6375-45b1-90e8-bcc782a80129	2026-04-09 16:47:41.242823+00	2026-04-09 16:47:41.242823+00	password	3b14dd55-108c-456a-b481-55b35b62d254
\.


--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_factors" ("id", "user_id", "friendly_name", "factor_type", "status", "created_at", "updated_at", "secret", "phone", "last_challenged_at", "web_authn_credential", "web_authn_aaguid", "last_webauthn_challenge_data") FROM stdin;
\.


--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."mfa_challenges" ("id", "factor_id", "created_at", "verified_at", "ip_address", "otp_code", "web_authn_session_data") FROM stdin;
\.


--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_authorizations" ("id", "authorization_id", "client_id", "user_id", "redirect_uri", "scope", "state", "resource", "code_challenge", "code_challenge_method", "response_type", "status", "authorization_code", "created_at", "expires_at", "approved_at", "nonce") FROM stdin;
\.


--
-- Data for Name: oauth_client_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_client_states" ("id", "provider_type", "code_verifier", "created_at") FROM stdin;
\.


--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."oauth_consents" ("id", "user_id", "client_id", "scopes", "granted_at", "revoked_at") FROM stdin;
\.


--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."one_time_tokens" ("id", "user_id", "token_type", "token_hash", "relates_to", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."refresh_tokens" ("instance_id", "id", "token", "user_id", "revoked", "created_at", "updated_at", "parent", "session_id") FROM stdin;
00000000-0000-0000-0000-000000000000	25	vximyyejwmdo	bb9faa60-fbd8-44ef-9421-94554431ad64	t	2026-04-07 14:59:08.780815+00	2026-04-08 10:46:11.188568+00	\N	9874be8e-83fc-4b63-a800-079bb2b15a7d
00000000-0000-0000-0000-000000000000	32	yhdk7z5ngdfg	bb9faa60-fbd8-44ef-9421-94554431ad64	t	2026-04-08 10:46:11.210218+00	2026-04-09 16:45:59.002907+00	vximyyejwmdo	9874be8e-83fc-4b63-a800-079bb2b15a7d
00000000-0000-0000-0000-000000000000	46	vy3exuugkv6v	bb9faa60-fbd8-44ef-9421-94554431ad64	f	2026-04-09 16:45:59.034056+00	2026-04-09 16:45:59.034056+00	yhdk7z5ngdfg	9874be8e-83fc-4b63-a800-079bb2b15a7d
00000000-0000-0000-0000-000000000000	47	rianwsfkti46	bb9faa60-fbd8-44ef-9421-94554431ad64	f	2026-04-09 16:47:41.238148+00	2026-04-09 16:47:41.238148+00	\N	32372579-6375-45b1-90e8-bcc782a80129
\.


--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_providers" ("id", "resource_id", "created_at", "updated_at", "disabled") FROM stdin;
\.


--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_providers" ("id", "sso_provider_id", "entity_id", "metadata_xml", "metadata_url", "attribute_mapping", "created_at", "updated_at", "name_id_format") FROM stdin;
\.


--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."saml_relay_states" ("id", "sso_provider_id", "request_id", "for_email", "redirect_to", "created_at", "updated_at", "flow_state_id") FROM stdin;
\.


--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."sso_domains" ("id", "sso_provider_id", "domain", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: webauthn_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_challenges" ("id", "user_id", "challenge_type", "session_data", "created_at", "expires_at") FROM stdin;
\.


--
-- Data for Name: webauthn_credentials; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

COPY "auth"."webauthn_credentials" ("id", "user_id", "credential_id", "public_key", "attestation_type", "aaguid", "sign_count", "transports", "backup_eligible", "backed_up", "friendly_name", "created_at", "updated_at", "last_used_at") FROM stdin;
\.


--
-- Data for Name: ai_proposals; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ai_proposals" ("id", "status", "category", "provider", "model", "input_json", "output_json", "related_parcel_id", "related_campaign", "related_work_record_id", "proposal_reason", "proposal_version", "created_at", "updated_at", "executed_at", "execution_error", "created_by", "source", "hash") FROM stdin;
\.


--
-- Data for Name: ai_proposal_validations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ai_proposal_validations" ("id", "proposal_id", "decision", "note", "decided_by", "decided_at") FROM stdin;
\.


--
-- Data for Name: analisis_agua; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."analisis_agua" ("id", "finca", "fuente", "fecha", "ph", "conductividad_ec", "salinidad_ppm", "temperatura", "sodio_ppm", "cloruros_ppm", "nitratos_ppm", "dureza_total", "operario", "herramienta", "observaciones", "created_at") FROM stdin;
2e5937e6-9b60-499c-b5db-2a741057e562	FINCA LA BARDA	Balsa de riego	2026-04-07 14:06:36.536029+00	0.00	0.000	0.00	\N	\N	\N	\N	\N	\N	Hanna HI9814	\N	2026-04-07 14:06:36.536029+00
427d2bc5-7da8-425e-a7c8-eec8db36887f	FINCA COLLADOS	Balsa de riego	2026-04-07 14:11:56.764918+00	0.00	0.000	0.00	\N	\N	\N	\N	\N	\N	Hanna HI9814	\N	2026-04-07 14:11:56.764918+00
\.


--
-- Data for Name: parcels; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parcels" ("parcel_id", "farm", "parcel_number", "code", "area_hectares", "irrigation_type", "status", "created_at", "tipo_suelo", "ph_suelo", "materia_organica_pct", "ultima_analisis_suelo", "irrigation_type_v2") FROM stdin;
concepcion-s10b	LA CONCEPCION	SECTOR 10-B	CON-10-B	0.25	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s12	LA CONCEPCION	SECTOR 12	CON-12	0.66	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s7	LA CONCEPCION	SECTOR 7	CON-7	1.1	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s4a	LA CONCEPCION	SECTOR 4-A	CON-4-A	1.65	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s4b	LA CONCEPCION	SECTOR 4-B	CON-4-B	1.91	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s4c	LA CONCEPCION	SECTOR 4-C	CON-4-C	1.95	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s1	LONSORDO	SECTOR 1	LON-1	1.2	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s8	LONSORDO	SECTOR 8	LON-8	0.74	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s9	LONSORDO	SECTOR 9	LON-9	0.89	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s10	LONSORDO	SECTOR 10	LON-10	0.25	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s13	FINCA LA BARDA	SECTOR 13	LA--13	3.07	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s10	FINCA LA BARDA	SECTOR 10	LA--10	2.85	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s21	FINCA LA BARDA	SECTOR 21	LA--21	2.16	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s25	FINCA LA BARDA	SECTOR 25	LA--25	2.9	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s5	FINCA LA BARDA	SECTOR 5	LA--5	3.34	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s4	FINCA LA BARDA	SECTOR 4	LA--4	3.17	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s3	FINCA LA BARDA	SECTOR 3	LA--3	2.91	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s2c	LA CONCEPCION	SECTOR 2-C	CON-2-C	0.8	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s6	LA CONCEPCION	SECTOR 6	CON-6	0.76	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s2b	LA CONCEPCION	SECTOR 2-B	CON-2-B	1.35	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s2d	LA CONCEPCION	SECTOR 2-D	CON-2-D	0.74	Goteo	plantada	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s3a	LA CONCEPCION	SECTOR 3-A	CON-3-A	0.98	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s3c	LA CONCEPCION	SECTOR 3-C	CON-3-C	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s11	LA CONCEPCION	SECTOR 11	CON-11	0.72	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s11	LONSORDO	SECTOR 11	LON-11	0.66	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s12	LONSORDO	SECTOR 12	LON-12	0.82	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s18a-2	FINCA LA BARDA	SECTOR 18-A	LA--18-A	1.51	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s7	FINCA LA BARDA	SECTOR 7	LA--7	2.7	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s6	FINCA LA BARDA	SECTOR 6	LA--6	2.98	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s8a	FINCA LA BARDA	SECTOR 8-A	LA--8-A	1.37	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s8a-2	FINCA LA BARDA	SECTOR 8-A	LA--8-A	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s9	FINCA LA BARDA	SECTOR 9	LA--9	2.96	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s24	FINCA LA BARDA	SECTOR 24	LA--24	2.97	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s3d	LA CONCEPCION	SECTOR 3-D	CON-3-D	1.44	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s1a	LA CONCEPCION	SECTOR 1-A	CON-1-A	1.2	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s3b	LA CONCEPCION	SECTOR 3-B	CON-3-B	1.53	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s1b	LA CONCEPCION	SECTOR 1-B	CON-1-B	1.49	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s5b	LA CONCEPCION	SECTOR 5-B	CON-5-B	1.47	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s1c	LA CONCEPCION	SECTOR 1-C	CON-1-C	1.06	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s2a	LA CONCEPCION	SECTOR 2-A	CON-2-A	1.37	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s5a	LA CONCEPCION	SECTOR 5-A	CON-5-A	0.86	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s8	LA CONCEPCION	SECTOR 8	CON-8	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s10a	LA CONCEPCION	SECTOR 10-A	CON-10-A	0.8	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
concepcion-s9	LA CONCEPCION	SECTOR 9	CON-9	1.32	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s2	FINCA LA BARDA	SECTOR 2	LA--2	3.14	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s20	FINCA LA BARDA	SECTOR 20	LA--20	2.89	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s1	FINCA LA BARDA	SECTOR 1	LA--1	3.14	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s24-2	FINCA LA BARDA	SECTOR 24	LA--24	3.22	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s14	FINCA LA BARDA	SECTOR 14	LA--14	3.03	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s11	FINCA LA BARDA	SECTOR 11	LA--11	3.06	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s16	FINCA LA BARDA	SECTOR 16	LA--16	3.08	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s12	FINCA LA BARDA	SECTOR 12	LA--12	3.28	Goteo	plantada	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s15	FINCA LA BARDA	SECTOR 15	LA--15	3.04	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s6	FINCA COLLADOS	SECTOR 6	COL-6	5.75	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s7	FINCA COLLADOS	SECTOR 7	COL-7	2.01	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s8	FINCA COLLADOS	SECTOR 8	COL-8	2.86	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s9	FINCA COLLADOS	SECTOR 9	COL-9	3.79	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s10	FINCA COLLADOS	SECTOR 10	COL-10	1.46	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s11a	FINCA COLLADOS	SECTOR 11-A	COL-11-A	3.67	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s11b	FINCA COLLADOS	SECTOR 11-B	COL-11-B	0.83	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s12	FINCA COLLADOS	SECTOR 12	COL-12	1.92	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s13	FINCA COLLADOS	SECTOR 13	COL-13	3.01	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s14	FINCA COLLADOS	SECTOR 14	COL-14	4.57	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s15a	FINCA COLLADOS	SECTOR 15-A	COL-15-A	2.21	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s15b	FINCA COLLADOS	SECTOR 15-B	COL-15-B	1.07	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-lago1	FINCA COLLADOS	LAGO 1	COL-LAGO1	0.86	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
brazo-virgen-s3	FINCA BRAZO DE LA VIRGEN	SECTOR 3	BRA-3	1.3	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s5	FINCA COLLADOS	SECTOR 5	COL-5	0.39	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
brazo-virgen-s4	FINCA BRAZO DE LA VIRGEN	SECTOR 4	BRA-4	3.55	Goteo	activa	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
brazo-virgen-s2	FINCA BRAZO DE LA VIRGEN	SECTOR 2	BRA-2	1.66	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
brazo-virgen-s1	FINCA BRAZO DE LA VIRGEN	SECTOR 1	BRA-1	0.57	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s23	FINCA LA BARDA	SECTOR 23	LA--23	2.87	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s22	FINCA LA BARDA	SECTOR 22	LA--22	1.65	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s17	FINCA LA BARDA	SECTOR 17	LA--17	2.93	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s19	FINCA LA BARDA	SECTOR 19	LA--19	1.82	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-barda-s18a	FINCA LA BARDA	SECTOR 18-A	LA--18-A	1.18	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s10	FINCA LA NUEVA	SECTOR 10	LA--10	1.36	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s9	FINCA LA NUEVA	SECTOR 9	LA--9	0.97	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s2b	FINCA LA NUEVA	SECTOR 2-B	LA--2-B	0.72	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s8	FINCA LA NUEVA	SECTOR 8	LA--8	0.94	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s11	FINCA LA NUEVA	SECTOR 11	LA--11	2.02	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s1a	FINCA LA NUEVA	SECTOR 1-A	LA--1-A	1.02	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s13	LONSORDO	SECTOR 13	LON-13	0.61	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s14	LONSORDO	SECTOR 14	LON-14	0.49	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s15	LONSORDO	SECTOR 15	LON-15	0.42	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s16	LONSORDO	SECTOR 16	LON-16	0.35	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s17	LONSORDO	SECTOR 17	LON-17	0.41	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s18	LONSORDO	SECTOR 18	LON-18	0.33	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s19	LONSORDO	SECTOR 19	LON-19	0.43	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s2	LONSORDO	SECTOR 2	LON-2	1.11	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s4	LONSORDO	SECTOR 4	LON-4	0.94	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
lonsordo-s3	LONSORDO	SECTOR 3	LON-3	0.89	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s1	FINCA COLLADOS	SECTOR 1	COL-1	3.15	Goteo	cosechada	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s2	FINCA COLLADOS	SECTOR 2	COL-2	4.64	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s3	FINCA COLLADOS	SECTOR 3	COL-3	2.39	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
collados-s4	FINCA COLLADOS	SECTOR 4	COL-4	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s2a	FINCA LA NUEVA	SECTOR 2-A	LA--2-A	0.54	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s3	FINCA LA NUEVA	SECTOR 3	LA--3	1.93	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s4	FINCA LA NUEVA	SECTOR 4	LA--4	1.89	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s5	FINCA LA NUEVA	SECTOR 5	LA--5	1.35	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s6a	FINCA LA NUEVA	SECTOR 6-A	LA--6-A	0.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s6b	FINCA LA NUEVA	SECTOR 6-B	LA--6-B	0.96	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
la-nueva-s1b	FINCA LA NUEVA	SECTOR 1-B	LA--1-B	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s5	FINCA MAYORAZGO	SECTOR 5	MAY-5	5.54	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s4a	FINCA MAYORAZGO	SECTOR 4-A	MAY-4-A	1.46	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s6	FINCA MAYORAZGO	SECTOR 6	MAY-6	3.63	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s4b	FINCA MAYORAZGO	SECTOR 4-B	MAY-4-B	3.23	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s2e	FINCA MAYORAZGO	SECTOR 2-E	MAY-2-E	1.58	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s2d	FINCA MAYORAZGO	SECTOR 2-D	MAY-2-D	1.32	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s2c	FINCA MAYORAZGO	SECTOR 2-C	MAY-2-C	1.31	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s2b	FINCA MAYORAZGO	SECTOR 2B	MAY-2B	0.9	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s2a	FINCA MAYORAZGO	SECTOR 2-A	MAY-2-A	0.5	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s1a	FINCA MAYORAZGO	SECTOR 1-A	MAY-1-A	0.52	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s1b	FINCA MAYORAZGO	SECTOR 1-B	MAY-1-B	1.07	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s1c	FINCA MAYORAZGO	SECTOR 1-C	MAY-1-C	1.73	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s1d	FINCA MAYORAZGO	SECTOR 1-D	MAY-1-D	1.48	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s1e	FINCA MAYORAZGO	SECTOR 1-E	MAY-1-E	1.73	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s3b	FINCA MAYORAZGO	SECTOR 3-B	MAY-3-B	1.95	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
mayorazgo-s3a	FINCA MAYORAZGO	SECTOR 3-A	MAY-3-A	1.58	Goteo	empty	2026-03-22 01:06:49.770266+00	\N	\N	\N	\N	\N
\.


--
-- Data for Name: analisis_suelo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."analisis_suelo" ("id", "fecha", "ph", "materia_organica", "observaciones", "conductividad_ec", "salinidad_ppm", "temperatura_suelo", "sodio_ppm", "nitrogeno_ppm", "fosforo_ppm", "potasio_ppm", "textura", "profundidad_cm", "num_muestras", "operario", "herramienta", "informe_url", "parcel_id") FROM stdin;
e6557b27-e85e-4663-9db0-81f337c33948	2026-04-07 13:58:10.238597	0	\N	\N	0.000	0.00	0.00	\N	0.00	0.00	0.00	franco arcilloso	20	1	\N	Hanna HI9814 + LaMotte	\N	la-barda-s12
b0e5cee5-ada1-42e7-b21c-039ef21c5d71	2026-04-07 14:06:36.384708	0	\N	\N	0.000	0.00	0.00	\N	0.00	0.00	0.00		20	1	\N	Hanna HI9814 + LaMotte	\N	la-barda-s12
e8d373ba-f593-4009-a34b-faa8c33fd137	2026-04-07 14:11:56.641518	0	\N	\N	0.000	0.00	0.00	\N	0.00	0.00	0.00	limoso	20	1	\N	Hanna HI9814 + LaMotte	\N	collados-s1
\.


--
-- Data for Name: aperos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."aperos" ("id", "codigo", "denominacion", "marca", "ubicacion", "estado", "created_at", "updated_at") FROM stdin;
c529de8f-4e66-4caa-840a-f6055e24ec80	001	CUBA HERBICIDA	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
c50a3795-e1cc-40ba-8b4b-c26bb2884a95	002	CUBA HERBICIDA	SOLANO	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
5e6966f3-394c-488f-b89e-1ce5adfba37d	003	CUBA	\N	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
f5193152-ac19-47d5-b6dc-024977acf114	004	CUBA	AGRICUR	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
404a26e0-7b13-4df3-8853-dc41ddec5320	008	TILDE MARCADORA	AGRIC	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
ca08ae26-96e3-4397-b2fd-230f70482866	009	MARCADORA	\N	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
fc1c8e17-7d20-4283-8eb8-e7061ad548e8	011	ROTOVATO	HOWARD	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
ffbd3d72-63c9-4f38-a94a-bbd57300b1bb	012	TIRADOR DE GOMA-PLATAFORMA TRACTOR	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
2fd92d0a-4f84-433d-bd39-a5597128102a	013	GRADAS DE DISCO	SOLANO-HORIZONTE	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
20773eb8-449d-4ce7-8dde-14492d71726f	014	VINADORA 5 CUERPOS	AGROSAN	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
3b794327-075f-4681-90d7-3999eb1e8aad	015	TORO - 1	ELEVADORA LA TORRE	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
51976dcf-8b81-4751-a5cd-29eb2d1001ea	016	DESBROZADORA CUELLO JIRAFA	MASACHIO	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
e3940366-73b9-4118-8208-70e08c8e7fcf	017	ABONADORA	SOLANO-HORIZONTE	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
bad81597-5fea-439f-8c98-f781b06c8e2a	018	JAULA-PLATAFORMA	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
c6ec5e24-d57b-4ac8-be3a-7020966b73d9	019	CULTIVADORES PEQUEÑOS 11 BRAZOS	DESUSO	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
42c63407-02db-4098-8d4a-751e8ad16d1c	020	CONFORMADORA CABALLONES	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
8b3a2496-ea6b-4d3a-9f5a-50c3e640a924	022	MARCADOR DE RALLAR	DESUSO	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
13008d77-d96a-467c-aaf8-8dd409349cf7	023	ROTOVATO PARTIDO	HOWARD	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
a81cec6f-0be4-4d24-8abf-36358364ae1e	033	ABONADORA	AGUIRRE	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
d25a9eae-9522-4c10-b28e-6aaa390aaae0	035	MARCADOR PARA RALLAR BROCOLI	\N	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
7538663c-6749-479e-8262-c73e3e54cb6e	036	MARCADORA, TIRADORA DE CINTA Y ABONO	LIZARAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
f3023af5-698b-43a8-b01f-51a52a42466c	037	CULTIVADORES	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
a27bc4ee-1c5c-4853-9e79-b33508bfb7ec	039	GRADAS DE DISCO	TRACTOMOTOR	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
e2604f7e-bdf2-4174-a786-3a3bcb8bdf22	041	RECOGEDOR HIDRAULICO	AGROALJORRA	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
b6abe23a-31db-4841-8734-f88baef26f57	042	CULTIVADORES 13 BRAZOS	CHIRLAQUE	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
4b417660-5af3-407f-93f4-7d4992223726	043	BINADORA 5 CUERPOS	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
07060083-8cb2-4bf7-a8bb-68d9861e0f72	044	TOPOS 5 BRAZOS	RODA	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
76998fb1-24ca-45f3-a14a-17fa8176783c	045	TORO	RODA	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
8f33cffa-272a-4050-bbba-99ea60865940	048	TRAJILLA	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
93d26ef1-8944-45e3-aa1e-7228415d2459	049	TOPOS DE 7 PATAS	DESUSO	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
9e167d58-df2e-4f15-9c1b-4162932966d1	053	ACABALLONADORA	\N	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
37909a25-eb1b-4cfe-bf2a-edea94c84e61	054	CULTIVADORES 1	\N	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
28e26123-e5f8-4c0f-a859-98b6b298f9ac	056	MAQUINA ABRIR ZANJA GOMA 63	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
ec899340-a36a-4216-80e1-75ec6961d2d6	057	TORO	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
e78180a1-a6c2-4ad7-8dc6-f7b70f862135	058	TOPOS 5 BRAZOS	JYMPA	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
2be6cc24-d559-475c-90d3-bd4137faf1b3	059	PORTAPALOT	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
a7e425f6-475f-4b6d-875c-0129879cc458	060	PORTAPALOT	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
9da17047-17f1-4351-b5d2-26ac94796bf4	061	VINADORA 3 CUERPOS	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
2514af36-e87e-4f04-8f29-475770fe64ee	062	PORTAPALOT	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
e9fcd13f-dc24-441c-b5e0-bf97492f4607	063	TORO - 2	RODA	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
c68410d4-4039-432c-a51b-d7ec080ebd8b	082	PORTAPALOT AZUL	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
2085e7db-b65a-4712-9352-8a7f74f51db0	083	CUBA ZANCUDA 3000L	AGROSAN	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
f3269f14-b1e5-484e-81e0-044bacf16d85	084	CUBA	ATASA	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
985a743a-521a-433f-856b-5efaf6443be4	085	MAQUINA HACER POZAS	DESUSO	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
64765e0b-8432-4c07-b738-4f4853eabde4	086	REMOLQUE	\N	CIEZA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
05c32a7d-83a4-455c-bd45-994965d7c410	087	CUBA	SOLANO-HORIZONTE	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
d43d9fb2-9370-4683-bd35-ffc2303616d6	088	TORO - 1	ELEVADORA LA TORRE	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
c6b67b0c-b651-4b65-bb00-1929918e2a83	089	BOMBA	DESUSO	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
f0a8c3f0-138f-47e2-bb1b-07ef526bf6c2	090	BOMBA	DESUSO	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
6690fc3d-8ecb-4825-a84a-17da01c5e07d	091	BOMBA	DESUSO	POLIGONO	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
47ef5143-74ff-42fe-889a-f7ac447167fc	092	PORTAPALOT	\N	LA BARDA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
379521ad-579c-4428-a77b-c78a6c837326	093	RECOGEDOR DE CINTA - 2	\N	LA BARDA	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
db8efce0-a6d6-4b09-aebd-f5fd677a1a9c	094	DESBROZADORA - PICADORA	MASACHIO	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
d401f99e-44d9-4583-b47f-9d75eef12202	095	SUBSOLADOR SACAPLASTICO	AGROSAN	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
1a55f8a1-9c3b-4510-bbfc-e91f3bd44ea3	096	MAQUINA TIRADOR DE PLASTICO	\N	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
f9b521f1-fb2a-46e3-a8d1-8011f3ddf4d9	097	ROTOVATO PARTIDO CAVADORA	TALLERES RIELES	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
701c4625-0d58-4633-b407-fb7342f83356	098	ROTOVATO	MASACHIO	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
926fdef5-611f-4791-ada4-0c038c0a40c9	099	PALA	LEON	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
04ae7022-cf04-4d17-8913-931e1fbe612e	100	REMOLQUE ESPARCIADOR DE ESTIERCOL	\N	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
186ef79e-deca-4ed3-b036-3de476ab2c15	101	RECOGEDOR DE CINTA - 1	DESUSO	CONCEPCION	disponible	2026-03-29 19:12:43.05644	2026-03-29 19:12:43.05644
\.


--
-- Data for Name: camaras_almacen; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."camaras_almacen" ("id", "nombre", "capacidad_palots", "temperatura_objetivo", "activa", "notas", "created_at") FROM stdin;
\.


--
-- Data for Name: camiones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."camiones" ("id", "matricula", "empresa_transporte", "tipo", "capacidad_kg", "activo", "created_at", "marca", "modelo", "anio", "fecha_itv", "notas_mantenimiento", "foto_url", "created_by", "kilometros_actuales", "fecha_proxima_itv", "fecha_proxima_revision", "km_proximo_mantenimiento", "gps_info", "codigo_interno", "estado_operativo") FROM stdin;
\.


--
-- Data for Name: catalogo_tipos_mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."catalogo_tipos_mantenimiento" ("id", "nombre", "modulo", "activo", "created_at") FROM stdin;
59797b90-e794-4d69-a178-61b8c122b132	ITV	logistica	t	2026-04-03 13:44:57.077559+00
a739c9f0-dd61-483c-b697-a3be8cdaa89b	Revisión periódica	logistica	t	2026-04-03 13:44:57.077559+00
ae44c342-ad49-44b8-a620-f06e5794654f	Avería	logistica	t	2026-04-03 13:44:57.077559+00
d5ea004c-3d74-4761-95dd-1776d17921a5	Cambio ruedas	logistica	t	2026-04-03 13:44:57.077559+00
fe7e7e60-153a-4085-9c01-f546302e3426	Cambio aceite	logistica	t	2026-04-03 13:44:57.077559+00
480dd067-b206-401b-af1f-32435b2688fa	Cambio filtros	logistica	t	2026-04-03 13:44:57.077559+00
a6c8d53c-6d94-4ab9-9a18-47fdd49b90fe	Revisión frenos	logistica	t	2026-04-03 13:44:57.077559+00
\.


--
-- Data for Name: catalogo_tipos_trabajo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."catalogo_tipos_trabajo" ("id", "nombre", "categoria", "activo", "created_at", "updated_at") FROM stdin;
8593e0ec-5797-4015-abee-7f0e7bd07303	Preparación de suelo	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
b5e897a6-ab1d-4869-98bb-d2b8636cc564	Acolchado	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
4d29ab08-a138-4582-a5c0-90dd5ad6e2db	Plantación mecanizada	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
8190aa6e-0eb2-4d7e-82a8-0dc8368055c0	Cosecha mecanizada	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
cef2c425-eb09-4986-abda-03723d981965	Riego	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
2de2fad8-3cf7-4dd7-ba94-15f2d9268f30	Tratamiento fitosanitario	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
6ca12e70-7144-4f82-9865-4404cb6fa8d0	Abonado	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
c7861df7-a44d-4dfb-9f3a-d3e9c1d3c7c6	Desbrozado	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
41d8da11-5abf-4c2b-bed1-5cd197dfe3b0	Labores de tractor	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
1da42e68-0f3f-4ec8-8eaf-50ae0f17c363	Siembra	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
c31ea095-b592-4030-bd9b-5cbf1d45f197	Colocación plástico	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
e1d988e0-fcdb-47a5-b897-5722d8666831	Retirada plástico	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
db2adeb3-2c47-4cb8-9fca-0a15d739a5cf	Transporte interno	maquinaria	t	2026-04-03 13:30:14.833069+00	2026-04-05 20:48:36.04391+00
06003a12-edc6-478f-83cf-5ddb81df6495	Transporte servicio a campo	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
66dba25a-4296-4e71-8b6b-9883c520c2ce	Gestión residuos vegetales	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
7187986a-a81a-4c04-aaea-5b325b98cf54	Gestión residuos plásticos	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
c55f0437-23b3-4b76-9f6b-bff9a6ca9f3f	Transporte materiales	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
a97a1219-6adb-49f0-abf5-e029f2288555	Transporte maquinaria	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
b08bc75d-6eca-4234-a7aa-8f738b720312	Recogida cosecha	logistica	t	2026-04-03 13:44:57.077559+00	2026-04-05 20:48:36.04391+00
866dbe85-b0da-4914-a7d2-1646119e67d3	Desbroce	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
82d8b8fc-c885-4522-a148-7d3ec9791ca6	Plantación manual	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
a8d0ff28-8e0b-45a0-a311-d366612d59c0	Cosecha manual	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
be328ebf-3835-4067-9d54-1fc1ff7b7bc3	Colocación plástico	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
72c69892-3f2e-43e2-9ff0-df6be8b8928d	Retirada plástico	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
e732f1d1-a855-4d0d-8bc9-aca44bb966c3	Riego manual	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
a1469dab-a110-4bf8-834d-6a6b2929b674	Poda	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
6033c887-7124-4d0b-9900-8efbf18a1bc2	Tratamiento fitosanitario manual	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
bd2efe2d-ae8b-486d-88d9-35430cc752a3	Abonado manual	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
886f143a-ecd7-4bd8-8676-5bfd79a5ade0	Preparación semillero	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
7e3c2d9b-76c6-4d3c-b7cc-83d4c3077af6	Limpieza nave	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
f5d88c91-1152-4bfb-962a-bed422dbd007	Carga y descarga	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
85a7f0d5-ab59-4fa1-b49a-27d9b2cb13af	Mantenimiento instalaciones	operario_campo	t	2026-04-03 17:53:30.794856+00	2026-04-05 20:48:36.04391+00
\.


--
-- Data for Name: certificaciones_parcela; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."certificaciones_parcela" ("id", "parcel_id", "entidad_certificadora", "numero_expediente", "campana", "fecha_inicio", "fecha_fin", "estado", "observaciones", "created_at") FROM stdin;
\.


--
-- Data for Name: partes_diarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."partes_diarios" ("id", "fecha", "responsable", "notas_generales", "created_at", "created_by") FROM stdin;
535fe859-e989-482b-b0d8-5d707538e7fa	2026-04-06	JuanPe	\N	2026-04-06 10:05:18.556687+00	sistema
\.


--
-- Data for Name: cierres_jornada; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cierres_jornada" ("id", "fecha", "parte_diario_id", "trabajos_ejecutados", "trabajos_pendientes", "trabajos_arrastrados", "notas", "cerrado_at", "cerrado_by") FROM stdin;
\.


--
-- Data for Name: cuadrillas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cuadrillas" ("id", "nombre", "empresa", "nif", "responsable", "telefono", "activa", "qr_code", "created_at") FROM stdin;
\.


--
-- Data for Name: cultivos_catalogo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."cultivos_catalogo" ("id", "nombre_interno", "nombre_display", "ciclo_dias", "rendimiento_kg_ha", "marco_std_entre_lineas_cm", "marco_std_entre_plantas_cm", "kg_plastico_por_ha", "m_cinta_riego_por_ha", "es_ecologico", "created_at") FROM stdin;
3691b0b2-eb6c-47e3-83fb-48572eb015c2	broccoli	Brócoli	90	18000.00	100.00	40.00	1200.00	8000.00	t	2026-03-10 22:29:57.593316+00
d9263374-c9d9-4f99-97c4-de1241538b41	cabbage	Col	110	22000.00	100.00	50.00	1100.00	7500.00	t	2026-03-10 22:29:57.593316+00
2f94d41d-34a3-46e7-8ffc-bfd3f7c217ad	lettuce	Lechuga	60	14000.00	40.00	30.00	1000.00	7000.00	t	2026-03-10 22:29:57.593316+00
8f9a1b54-ce37-42ee-bbec-e10f996b9e06	celery	Apio	120	20000.00	80.00	40.00	1100.00	7500.00	t	2026-03-10 22:29:57.593316+00
aea1dc84-e828-4b72-bb82-768ad4570d65	brocoli	Brócoli	90	18000.00	100.00	40.00	180.00	10000.00	t	2026-03-12 00:33:47.905944+00
08ad817c-bd18-4f71-b52e-e45cff5c849f	coliflor	Coliflor	95	18000.00	100.00	40.00	180.00	10000.00	t	2026-03-12 00:33:47.905944+00
36af0e17-7060-441b-a6c6-b42edba6bca9	romanesco	Romanesco	95	16000.00	100.00	40.00	180.00	10000.00	t	2026-03-10 22:29:57.593316+00
a9e4a837-5790-43b6-a473-876377a6baf2	col	Col	120	22000.00	100.00	50.00	180.00	10000.00	t	2026-03-12 00:33:47.905944+00
2ffb85b8-2a99-4555-9da9-18f40c306ff1	lechuga	Lechuga	60	14000.00	33.00	33.00	180.00	10000.00	t	2026-03-12 00:33:47.905944+00
0b96cca0-7d98-47ca-bdcc-388f4502f7dc	apio	Apio	110	20000.00	100.00	40.00	180.00	10000.00	t	2026-03-12 00:33:47.905944+00
\.


--
-- Data for Name: erp_exportaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."erp_exportaciones" ("id", "tipo", "fecha", "registros_exportados", "formato", "notas", "created_at") FROM stdin;
\.


--
-- Data for Name: fotos_campo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."fotos_campo" ("id", "parcel_id", "fecha", "url_imagen", "descripcion", "latitud", "longitud", "tipo") FROM stdin;
\.


--
-- Data for Name: ganaderos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."ganaderos" ("id", "nombre", "telefono", "direccion", "activo", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: harvests; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."harvests" ("id", "parcel_id", "date", "crop", "production_kg", "notes", "created_at", "price_kg", "harvest_cost") FROM stdin;
2bff4155-3768-4826-9382-b82fd54d6005	collados-s1	2026-02-10	broccoli	66.24	\N	2026-04-07 14:16:52.663952+00	\N	\N
\.


--
-- Data for Name: inventario_categorias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_categorias" ("id", "nombre", "slug", "icono", "orden") FROM stdin;
3c13b986-79a9-4eda-b58a-3bd1fe794f1c	Fitosanitarios y abonos	fitosanitarios_abonos	FlaskConical	1
a591a847-386f-4ba7-b3c5-0af93ebcc6d4	Material riego	material_riego	Droplets	2
2d5d50a7-7001-4700-9081-f72dcb7a90a4	Plástico	plastico	Layers	3
d72a9030-d950-4b10-ba51-43312f6b6a89	Manta térmica	manta_termica	Wind	4
834e7609-e27f-4f74-ab0e-d7da3b15e7b8	Aperos manuales	aperos_manuales	Wrench	5
a000a625-c2e5-437a-b552-71fe1e5aed46	Material diverso	material_diverso	Package	6
f257c173-a779-4579-9f5d-2fd503f605af	Maquinaria grande	maquinaria_grande	Tractor	7
\.


--
-- Data for Name: inventario_productos_catalogo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_productos_catalogo" ("id", "nombre", "categoria_id", "precio_unitario", "unidad_defecto", "activo", "created_by", "created_at") FROM stdin;
09797026-9d69-43e0-8518-496d560cb9fc	20-5-5	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	0.67	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7508fdcc-e978-40a5-9863-5f528cc0c127	ACIDO NITRICO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
f3d8b80b-abaa-4085-953b-6ce3f4fd491e	AFFIRM	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	125.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9ce7b367-4272-4868-bf79-f6519fe29ffc	ALARGADERA	f257c173-a779-4579-9f5d-2fd503f605af	12.95	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
bc4fde46-cd16-42cb-a478-5b670c49f4ad	ALARGADERAS	f257c173-a779-4579-9f5d-2fd503f605af	12.95	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
6e0e5fba-0653-4ec1-8b9f-63b16612b178	ALTACOR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
f94280f8-5514-46e9-ab6d-e64d0b1e844b	ARCTISE	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	222.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
61b9b51b-a85b-47da-8011-fea2f1286d3a	ARQUETA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	89.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
42c39319-0256-411a-9d95-309066e3f05d	AZADAS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	11.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ce12fee7-14f1-4bf0-a43c-5ee4e26cf11e	AZUCAR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.05	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ee1e4202-84ba-474e-82b4-f5fb9831a403	BELTHIRUL	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	16.95	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7d802e79-4049-4242-ba3d-d67dbdde48bd	BIDON ABONO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	400.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8ec1db4e-e738-4c81-82aa-2083ab370e41	BIDÓN ABONO	a000a625-c2e5-437a-b552-71fe1e5aed46	400.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8388ae7d-2d98-480e-b403-a930398b6ce4	BIO-K	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4270c455-403c-411c-a330-95c3b418e640	BLUE-N	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	118.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
270047f5-87b2-4598-b929-7dc90675e877	BOMBA AGUA	f257c173-a779-4579-9f5d-2fd503f605af	883.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1b10e5f2-0fc9-4163-ab30-1abce4ecf91b	BOMBA RIEGO 30 CV	f257c173-a779-4579-9f5d-2fd503f605af	2500.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1983fdd1-6fc3-480c-8eb5-e3b3d8c69d79	BUTANO ARREGLAR TUBERIAS	a000a625-c2e5-437a-b552-71fe1e5aed46	17.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
cfba1da8-e96b-4dfd-8112-98fcbceb34e0	CAJA DE GOMAS	a000a625-c2e5-437a-b552-71fe1e5aed46	37.46	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e6d4ff45-2993-4635-afe5-77112f722875	CALCIUM ACETATE GRANULAR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
bc1379d8-0b4c-4a22-a875-00c0f645fa44	CAPAZOS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	5.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
92419b3f-da68-43fd-b783-8424f5d2fcd6	CAPAZOS GRANDES	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	8.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
a5905cf4-4d3f-438c-bb78-8a03cf67b6e9	CAPAZOS PEQUEÑOS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	4.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0b784f50-56eb-40b9-95c7-3bde98bd162f	CARAQUIN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	3.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0373d239-057a-49a9-8268-b05316d1b9fa	CARRETILLA	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	53.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
52156767-9096-4c90-8b29-aac87dd9315e	CASQUILLO 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	2.48	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ccd1ddbe-180b-4914-9b4d-1c8be4de1e9a	CASQUILLO 90	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	2.48	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7018280e-ca65-46fb-ac97-727ac8c19181	CAÑON ESPANTAPAJAROS	f257c173-a779-4579-9f5d-2fd503f605af	426.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b7b440b4-a9e8-4f76-a363-b16890d45d0b	CLOSER	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	175.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
11da9e43-64e6-463f-80eb-10a7c1d18bd1	CODO 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	2.08	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
44cca3d3-2872-4868-ac37-4429f17ac25a	CODO PVC 110	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	29.36	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d16f7aea-9637-4a02-b399-6f3b1f19d0e3	CODO PVC 160	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	42.72	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e1ba73dc-323f-4ae1-bddb-a2b5d67b0a71	CODO PVC 75	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	4.63	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0ad83ea6-b3e7-40ca-a855-601e701e97ef	CODO PVC 90	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	5.56	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8725aa73-9c16-46ae-9f56-036c783101fc	CODO PVC160	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	42.74	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
58260f95-6f53-45f6-85be-126d2ed9ebb2	COMPRESOR	f257c173-a779-4579-9f5d-2fd503f605af	169.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
99a4aa74-fbb6-4946-8a0d-40c1a52011f1	COMPRESOR AIRE	f257c173-a779-4579-9f5d-2fd503f605af	173.80	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
37968a1e-695e-44bd-8784-10fee833c478	COMPUERTA RIEGO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	164.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
017c61b2-5e11-47ec-a464-8ecd7d54e9e1	CORBO	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	52.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b58c71bf-c3e9-4e6c-ae14-b5ef70f9aea8	CTR 16	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
793251a3-b8e5-4df0-82f3-99573d644074	CTR16	a000a625-c2e5-437a-b552-71fe1e5aed46	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e0e1f08e-be90-4e40-b677-17cef962f7c7	CUPER	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	7.42	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5a09046c-09fa-4c6e-92af-a80e27696c5c	CXP	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	42.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
f77b799d-a410-4e91-a2f5-e9c96b8b9f7a	CYTHRIN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	36.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
236275e6-6d01-4581-b05e-1ae7eefbae5d	DECIS EVO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	34.32	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7cfbaffb-dd06-46fc-8cea-3239d50da622	DESBROZADORA	f257c173-a779-4579-9f5d-2fd503f605af	690.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
064cf777-6c3c-40cd-9224-adac76585e22	DIOXI ALLIANCE	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	26.85	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
2360a1a2-b094-4ed1-a030-bdcf13416246	DIOXI BITERCAS	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	3.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
662e5257-07d1-4e90-bdd0-00430dc57768	DIOXI BLUE	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1d019e8e-3476-490b-8731-4e1ebb15b358	DIOXI BOR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	4.35	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d2d06f37-a2c8-4a1a-90b4-fab9e2996baf	DIOXI CONTROL	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	6.25	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b657fab6-2bc8-4e03-87a5-574abdbdeba9	DIOXI GO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	25.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b8af54b7-7073-4a9f-a164-b46d64eb5058	DIOXI KIRA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	36.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
09be971c-e1a1-4549-a9d0-1c93260e7c0a	DIOXI MAR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	8.95	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
fea93278-0874-4c9e-8e13-3fd730ad9b95	DIOXI MICRO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	5.40	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ba54b1da-5891-4a95-9c25-5b8c4362e25b	DIOXI OIL	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	8.10	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9d8ceefe-830c-4b22-b4c4-9a851f1983c1	DIOXI SPEED	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	2.85	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
f9bf2d99-f328-487a-a9b3-64b7048036cc	DIOXI TAROK	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7ad6addc-3cbc-41b8-b654-936a064289ca	DOCTRIN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	16.70	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8db112df-c3f2-4382-a6d1-9c39330737d8	DUREZA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	32.30	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
6bb116ca-aeab-48f4-95a3-b9a6435790b5	ECOMED OXYGEN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.65	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
39b81eb6-675a-40fd-be0f-9eab87e99fa6	ELECTROVALVULA 125	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	79.46	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
86ec0109-06ad-42e3-be72-9cfc6280518c	EMPALME CINTA-CINTA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0a373a09-60ed-44b7-9fd1-32416b946cef	EMPALME DE 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	48.37	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
89182082-bb20-4299-addb-c6d5f214b539	EMPALMES DE 16	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ce0bdb61-c532-48e5-b8c6-99ce9b8bb730	EMPALMES Ø63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	48.37	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
cb75d2a5-320d-43ac-8665-c5846cebabde	ENLACE 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	48.37	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5b4afe2b-3b71-45ba-bae4-3445520e3c2c	ENLACE CINTA A CINTA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1ffb4939-4063-4b4d-9695-9efa6a434923	ENLACE CINTA TUBERÍA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.02	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
905b018c-f7e1-493b-8c95-07283cb819a8	ENLACE CINTA-CINTA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.03	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e7dd7ce1-ef4f-48e8-bb4c-2a90a9168eb9	ENLACE CINTA-GOMA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.02	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1abf6e7f-9c8c-440b-905a-4c3b89a13342	FLEJADORA MANUAL	f257c173-a779-4579-9f5d-2fd503f605af	350.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5c1e037c-3178-405a-969b-dedff59a832c	G-20	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	12.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
58c3d914-23b2-4b89-a882-7c9b9f41a335	GOAL	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	21.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d680cc9d-e751-4bc7-9268-5602d83aba93	GOMAS REUTILIZABLES S-13 Y S-14	a000a625-c2e5-437a-b552-71fe1e5aed46	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
cbf9c0a7-9130-4616-b6fa-84074aed7ade	HILAS DE RIEGO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8e4be369-038a-4d8d-b172-6fa92f6b8627	HOMERO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	23.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b1b995e4-fe91-4f7d-8576-adf35fe11ced	KARCHER	f257c173-a779-4579-9f5d-2fd503f605af	1450.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
bc8fb746-77ad-42cc-be7e-736796c1d632	KUSU	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
925f714f-4f93-4d99-8dfb-fa39acdf507c	LATIGUILLO HIDRAULICO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	7.80	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4a0cecfc-1db7-4b87-be6a-20d456cd7372	LEDOR	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	8.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
31605150-ede1-4a24-8e8d-5768a089740c	LIMAGRAM	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ea42c1ed-bd15-48c9-a603-1846c62be9e5	LLAVE 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	23.48	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
12c1e4a4-bbb1-4931-8397-101120c044cb	LLAVE APRETAR TUBERIA 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	17.40	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ed209f9c-376a-4c4a-b508-ee1bf510512e	LLAVE APRIETA TUBERIA 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	17.40	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
cef48eee-d02f-4cfc-be9c-e82c1505d886	LLAVE DE 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	23.48	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
3aacd65c-3608-4576-aac3-cdae1f6702e1	MALLA	a000a625-c2e5-437a-b552-71fe1e5aed46	67.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7a0f7975-83fe-41ad-934e-90d45c80eebe	MANTA TERMICA	d72a9030-d950-4b10-ba51-43312f6b6a89	98.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
065a5cbf-587c-4ea6-9988-1562c7f565a4	MANTA TÉRMICA	d72a9030-d950-4b10-ba51-43312f6b6a89	98.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
c9ff0cde-55ef-4dc0-bb70-8a61f9de8389	MIRTO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	40.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
946c22d7-5d57-4d78-9fea-fd9c990daca5	MOCHILA FUMIGAR	f257c173-a779-4579-9f5d-2fd503f605af	150.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e53cfbf9-f480-4be2-a1ae-3c92438d55e8	MOCHILA FUMIGAR MOTOR	f257c173-a779-4579-9f5d-2fd503f605af	150.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4620d56c-456a-4d6c-a73f-26b78bc0075f	MOCHILAS FUMIGAR	f257c173-a779-4579-9f5d-2fd503f605af	150.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
a217fb3e-69e3-4b9d-8559-fc68874434f5	MOTOR	f257c173-a779-4579-9f5d-2fd503f605af	883.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9af42ed1-407b-44c4-9dfe-d3da86ee36cf	MOTOR AGUA	f257c173-a779-4579-9f5d-2fd503f605af	883.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
38b6268e-9bdc-48e3-9431-56743f894502	MOTOR AZUFRE	f257c173-a779-4579-9f5d-2fd503f605af	1050.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ccdb5f70-ac15-4e9b-8621-6f73956871be	MOTOR INYECTOR AGUA	f257c173-a779-4579-9f5d-2fd503f605af	980.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9c9b8643-ed7d-4c75-8f78-dc730e3aa21a	MOTOR RIEGO 30 CV	f257c173-a779-4579-9f5d-2fd503f605af	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
14a51ab4-7122-41dc-8c4b-e6b65e8b02a4	N-28	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	8.25	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8b508c46-4ec8-4be8-bc2b-fbba95be7cfd	NITRO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	10.42	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4046d9fe-15d8-41cb-9cd7-482f399d51c1	OBERON	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1d2dc242-e2ed-4bc8-944e-b06fd70b268c	ORCA	a000a625-c2e5-437a-b552-71fe1e5aed46	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9c03ffd3-4be1-43fb-b678-97caca92ab96	ORGAN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	2.26	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
60f85014-20df-4399-9d15-1d4bb1e79ee6	ORGANICO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.60	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d96f6894-576d-41c9-b9c0-0ce833166bcf	PALA	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	27.40	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4fac9b75-93d4-409a-968c-c4e2b6985dfe	PANDORA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	0.60	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1f69d646-b93d-44d9-b159-a8eaec74d109	PICO	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	59.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
56d6bb85-ffb2-4350-84bd-57977ded1377	PINZAS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	100.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
2269526e-f489-40e4-92ea-6dc0cf759748	PROMETREX	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	25.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b0ae79bd-e4f0-46cb-a0b9-a6f8221a1e6c	PÌNZAS	a000a625-c2e5-437a-b552-71fe1e5aed46	100.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
62c98b87-97b7-4e1c-8ccd-49877059ab41	R-28	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	44.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
21bfc76f-05dc-46be-8892-31116c68103d	RADIAL	f257c173-a779-4579-9f5d-2fd503f605af	180.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
cbdb91fe-7ec0-4b48-9146-780b20e5d640	RASQUETAS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	14.18	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5bb22e5e-f58b-404c-8e8f-b55a8aabc56f	RELOJ PRESION	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	67.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5bf427d3-4643-4c42-82d8-6d6535450fca	RELOJ PRESIÓN	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	67.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4330dd67-8399-4200-8834-614d071e12af	REMOVEDOR ABONO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	9.80	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
19b75ffb-0ff4-4131-be2e-c717dd897883	ROLLO CINTA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	71.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7fd730a5-5bc4-4a44-b327-09908aaad507	ROLLO FLEJE	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	10.46	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
98200e33-1188-4510-ad6e-4c060f902ff1	ROLLO GOMA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	101.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ee106369-2605-4093-befe-a5af426c8ff5	ROLLO GOMA CIEGA	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	240.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4fcb7056-2636-49e6-9869-1f16ac7bcf99	ROLLO GOMA CONEXIÓN	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	158.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
49c05e35-f183-494d-86b3-6299213588e4	ROLLO MALLA	a000a625-c2e5-437a-b552-71fe1e5aed46	48.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ff1dcbe0-c1d6-4283-9908-d520dd899626	ROLLO MALLA 50 M	a000a625-c2e5-437a-b552-71fe1e5aed46	48.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
228b8684-83a4-4b26-85b4-7e01488a27ee	ROLLO MANTA HOKAIDO	d72a9030-d950-4b10-ba51-43312f6b6a89	48.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8977fc93-90ba-4dc2-bb31-dc9ea48f83c7	ROLLO MANTA TERMICA APIO	d72a9030-d950-4b10-ba51-43312f6b6a89	150.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
79d5e762-567e-4b4a-bc5c-6ecf05a88036	ROLLO PE 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	42.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0599e8b1-3a59-4df3-aca8-3f71e7a093bf	ROLLO PLASTICO BROCOLI	2d5d50a7-7001-4700-9081-f72dcb7a90a4	120.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
6e0b24bc-030e-4229-9c36-7d150de5041f	ROLLO PLASTICO CALABACIN	2d5d50a7-7001-4700-9081-f72dcb7a90a4	96.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7d94f5f6-2671-4364-b335-007e47e4e9bb	ROLLO PLASTICO LECHUGA	2d5d50a7-7001-4700-9081-f72dcb7a90a4	120.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
c975a10c-20ed-4ad8-a1d8-4eb490bc979c	ROLLO POLIETILENO 63	a000a625-c2e5-437a-b552-71fe1e5aed46	42.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
14adc207-afdb-4a8f-9124-3d9aa3597870	ROLLO VALLA CONEJO	2d5d50a7-7001-4700-9081-f72dcb7a90a4	63.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0eeb721d-9337-4da2-9c0c-21bf5fe8d91c	ROLLOS CINTA GOTEO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	71.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d1954fa4-b0fe-47b8-997b-054ef4de37e8	ROLLOS FILM	2d5d50a7-7001-4700-9081-f72dcb7a90a4	120.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ca5a2d3a-25a3-4da0-acfd-020c4935fd3c	SERRUCHO PODAR	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	71.84	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1603e6f0-8042-4d05-846e-845628f5e7c2	SIAPTON	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	6.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
5754013c-5476-4eec-a80b-3d4dfb3d85d4	SOLDIER	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	42.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
c95b7d54-237a-4688-a1e1-d6e22d1b7751	SOLUCION N32	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	0.67	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
79bdf0ad-46da-4a99-a5a9-93cac80ba15a	SPINOSAD 48%	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	275.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
a2456830-595c-4e82-9452-6758fab81fb4	SUBMARINO	f257c173-a779-4579-9f5d-2fd503f605af	\N	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
37ecfdca-54b8-41ba-8b2a-de799142ee58	SULFATO DE MAGNESIO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	0.44	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
91e98b66-2db3-4880-aa2d-384d9ee07e50	T 110	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	13.28	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1992c827-d6ca-4f18-8f45-a73943a15c0a	T 75	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	6.42	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b28a37b8-1132-4c47-8e65-d1f6380ccb64	T 90	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	7.71	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
af103d93-68e3-4801-8cbc-28069201fa86	TAPONES 16	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.05	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
41fd603d-4053-4eb5-b2b2-ed24496925a1	TAPONES 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	2.73	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b220d969-5196-4032-8774-9af104aa0c43	TAPONES Ø16	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	0.05	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
beef65e8-3aa5-44df-9f04-4d8facf4ef89	TAPONES Ø63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	2.73	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
9acf7179-03e1-40eb-91e2-eeed59449e79	TENSIVE ZN MN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	3.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
f464ecb4-76d3-4164-be58-6783b484390a	TERAFIT	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	67.05	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
c7e2ef50-bee5-4ef4-8fb0-05ddb9931b9e	THIOVIT	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.95	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d6030b1e-82a5-4fa6-8f2c-e4c56c6c61ed	TIJERA PODAR	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	247.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
172ba697-0dcc-425b-b2dd-d6bb3ccbfdf9	TIJERAS DE CONEXIÓN	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	53.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
49a1a765-bdb5-41c0-b9db-db978e5b30fb	TITAN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	5.55	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
32e998e4-00d2-423d-ac8a-a4bd5bd48b75	TOUCHDOWN	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	4.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
7d865821-52a1-446b-aa7d-7e608f6b2b2a	TRASPALAETAS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	450.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b6d25e9d-b23b-4c9c-9f56-e02f92d53796	TRASPALETA	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	450.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b3dd8aa3-1ead-465c-8107-ae44307f6632	TRASPALETAS	834e7609-e27f-4f74-ab0e-d7da3b15e7b8	450.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
513813c7-3d08-479b-b585-29b459a5cf55	TRITON	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	0.69	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
fc1196a9-4945-4492-8657-71e61cf49720	UNION 110	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	49.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
1646cc22-df7a-4189-b0a1-02108eb14a45	UNION 125	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	56.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
55696a53-52bb-41b4-9e83-9911c4f77b37	UNION 140	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	65.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
e2cc23a6-0b76-4227-9339-85f4fe163586	UNION 160	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	72.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
38e4a6fc-e11b-44b2-9040-2397c7837644	UNION 200	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	90.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
0a4b4874-e700-48df-96bb-2153e78407b5	UNION 90	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	30.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
d6a14319-59e4-4fcc-8a9e-34e3fe7d81d9	UNIÓN Ø 110	a000a625-c2e5-437a-b552-71fe1e5aed46	49.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
750e47be-fbf2-4e02-89ae-10c611c5a96c	UNIÓN Ø 125	a000a625-c2e5-437a-b552-71fe1e5aed46	56.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
94aba43c-85e1-49fe-b86c-a5c916b732b1	UNIÓN Ø 140	a000a625-c2e5-437a-b552-71fe1e5aed46	65.20	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
a4638217-4577-4d5a-8b07-582c88e160a4	UNIÓN Ø 160	a000a625-c2e5-437a-b552-71fe1e5aed46	72.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8d1cf863-5aec-4084-8032-07430fc48b9f	UNIÓN Ø 200	a000a625-c2e5-437a-b552-71fe1e5aed46	90.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
4168f7f4-1d5d-4888-bce4-436b1785386c	UNIÓN Ø 90	a000a625-c2e5-437a-b552-71fe1e5aed46	30.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
552527da-ea2e-4227-ba20-b21828953dcb	URANO OBERON	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.40	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
ec4513ca-25bd-40c8-b99b-c186b601abb6	VALVULA 50	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	23.42	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
bd937ac6-c96c-4964-ac7e-03e0c4462bbb	VALVULA 63	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	29.51	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
99acac2f-4115-4aa8-9d3b-aff838e1eddf	VALVULA RIEGO	a591a847-386f-4ba7-b3c5-0af93ebcc6d4	29.50	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
fc33653b-b650-43dd-b6fc-2930bd012b1c	VERA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	45.00	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
b3f440bb-8763-407a-b1f9-3cfbda1d6db0	VITACROPO ORGANICO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	1.30	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
8bcaf833-9cb4-4f74-a842-dd47c3cb5c64	YOOLKO	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	6.30	unidades	t	seed_historico_2026	2026-03-25 20:20:14.732328+00
67eef459-37dd-4e1c-bc3f-6e28fae101c5	PROACTIF DUREZA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	kg	t	\N	2026-03-30 22:52:49.579011+00
3db96731-1c8e-4060-a2d4-2f19454a4c3d	SMG ECOMET	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	kg	t	\N	2026-03-30 22:56:56.277685+00
848ae2d1-c49c-4d86-951e-06865f568d8f	DIOXI PIRAÑA	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	litros	t	\N	2026-03-30 23:07:45.987518+00
cce02e5b-afc5-465b-a898-70cfa643de03	DIOXI BIG	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	litros	t	\N	2026-03-30 23:11:05.098699+00
e0fa71b4-5baa-4722-bcbc-dd9ae395720c	DIOXI SOLDIER	3c13b986-79a9-4eda-b58a-3bd1fe794f1c	\N	litros	t	\N	2026-03-30 23:12:30.068196+00
\.


--
-- Data for Name: inventario_ubicaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_ubicaciones" ("id", "nombre", "descripcion", "foto_url", "activa", "orden", "updated_at") FROM stdin;
6a7d579b-b6e3-46b2-996e-2ae4d8b9f7df	Nave + Cabezal Finca Collados + Cabezal Brazo Virgen	\N	\N	t	1	2026-04-05 20:48:36.04391+00
c4d6e3db-4409-46f0-a749-3f3b033fe5d7	Cabezal Finca La Barda	\N	\N	t	2	2026-04-05 20:48:36.04391+00
bdd586c2-c219-401e-a6f5-42a4bf5894a1	Nave Polígono Finca La Barda	\N	\N	t	3	2026-04-05 20:48:36.04391+00
c24c879f-3d46-457a-86c8-1ff999b747c1	Nave Finca La Concepción	\N	\N	t	4	2026-04-05 20:48:36.04391+00
f74280c8-12f1-476d-9a70-5c062ebf734e	Nave Finca Lonsordo	\N	\N	t	5	2026-04-05 20:48:36.04391+00
1e998a90-af6e-402d-923a-41013f05a200	Semillero	\N	\N	t	6	2026-04-05 20:48:36.04391+00
\.


--
-- Data for Name: proveedores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."proveedores" ("id", "codigo_interno", "nombre", "nif", "telefono", "email", "direccion", "tipo", "persona_contacto", "activo", "notas", "foto_url", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: inventario_entradas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_entradas" ("id", "proveedor_id", "ubicacion_id", "categoria_id", "producto_id", "cantidad", "unidad", "precio_unitario", "importe_total", "receptor", "fecha", "foto_albaran", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: inventario_informes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_informes" ("id", "tipo", "fecha_inicio", "fecha_fin", "ubicacion_id", "categoria_id", "contenido", "generado_at", "created_by") FROM stdin;
\.


--
-- Data for Name: inventario_movimientos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_movimientos" ("id", "producto_id", "categoria_id", "ubicacion_origen_id", "ubicacion_destino_id", "cantidad", "unidad", "fecha", "responsable", "notas", "created_by", "created_at") FROM stdin;
\.


--
-- Data for Name: inventario_registros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_registros" ("id", "ubicacion_id", "categoria_id", "cantidad", "unidad", "descripcion", "foto_url", "notas", "created_at", "precio_unitario", "producto_id", "foto_url_2", "created_by") FROM stdin;
\.


--
-- Data for Name: maquinaria_tractores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."maquinaria_tractores" ("id", "matricula", "marca", "modelo", "anio", "horas_motor", "ficha_tecnica", "activo", "foto_url", "notas", "created_at", "created_by", "fecha_proxima_itv", "fecha_proxima_revision", "horas_proximo_mantenimiento", "gps_info", "codigo", "tipo", "estado", "ubicacion", "codigo_interno", "estado_operativo") FROM stdin;
\.


--
-- Data for Name: inventario_ubicacion_activo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."inventario_ubicacion_activo" ("id", "ubicacion_id", "maquinaria_tractor_id", "apero_id", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: lecturas_sensor_planta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lecturas_sensor_planta" ("id", "fecha", "indice_salud", "nivel_estres", "observaciones", "clorofila", "ndvi", "cultivo", "num_plantas_medidas", "operario", "herramienta", "parcel_id") FROM stdin;
64c76b6e-58c8-4b90-b9b5-7038a5893691	2026-04-07 13:58:10.417746	0	0	\N	0.00	0.000	\N	5	\N	SPAD-502	la-barda-s12
a59a5069-5565-43bb-b188-ad76b20d620c	2026-04-07 14:06:36.640232	0	0	\N	0.00	0.000	\N	5	\N	SPAD-502	la-barda-s12
f1514383-0314-4ca6-999f-899ca1fe8da3	2026-04-07 14:11:56.876453	0	0	\N	0.00	0.000	\N	5	\N	SPAD-502	collados-s1
\.


--
-- Data for Name: lia_contexto_sesion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lia_contexto_sesion" ("id", "fecha", "modulo", "evento", "datos", "procesado", "created_at") FROM stdin;
\.


--
-- Data for Name: lia_memoria; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lia_memoria" ("id", "tipo", "descripcion", "modulo", "finca", "parcel_id", "fecha_referencia", "peso", "verificado", "created_at") FROM stdin;
\.


--
-- Data for Name: lia_patrones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."lia_patrones" ("id", "patron", "frecuencia", "modulos", "ultima_deteccion", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: personal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."personal" ("id", "nombre", "dni", "telefono", "categoria", "activo", "foto_url", "qr_code", "notas", "created_at", "created_by", "codigo_interno", "fecha_alta", "carnet_tipo", "carnet_caducidad", "tacografo", "finca_asignada", "licencias") FROM stdin;
8469a8c7-d2c1-4bcf-af9e-3b33431dc239	RUBEN	\N	624 56 89 95	operario_campo	t	\N	e04d0e28-cbb6-4f2f-a490-18f483a7dc68	PERFIL POLIVALENTE	2026-03-27 13:58:19.787775+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
5f27a66b-900c-4340-a73f-f01b130c5837	JAVI	\N	604 24 09 42	operario_campo	t	\N	c8014228-5dbd-4c4c-98b4-f89e809b99ad	PERFIL MULTIFUNCIONAL	2026-03-27 13:59:19.058664+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
5b560367-3cd5-4c8e-af58-814eab68461a	JAIME	\N	650 21 76 90	encargado	t	\N	1b0979d5-8eb5-4b89-a260-0a57c9f33679	FINCA LA BARDA-MAYORAZGO	2026-03-27 14:01:24.220726+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
26636903-b68b-4792-b115-290ec67a09ff	LEONCIO	\N	631 915 586	encargado	t	\N	be90aae4-9176-4bb8-93f1-abb9e3f2480d	FINCA LA CONCEPCION-NUEVA-LONSORDO	2026-03-27 14:02:39.896851+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
6d0f53e5-6eea-4f44-80d6-b2592dd33a3f	SIMON	\N	622 94 41 76	encargado	t	\N	e5d80e4d-5a61-43c4-b425-39782348a1ec	FINCA COLLADOS-BRAAZO DE LA VIRGEN	2026-03-27 14:03:32.965566+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
6c2dfe74-4122-40e3-a5b0-2079f1aeeeae	MAXIMO	\N	649 71 64 74	conductor_maquinaria	t	\N	4bcac3c2-2034-4119-a92c-685a9efc3869	ENCARGADO TRACTORES	2026-03-27 14:04:13.253352+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
da88ba77-dcdf-4317-85ed-7e765c2ad573	JUAN	\N	629 03 48 42	conductor_camion	t	\N	bf2a12e9-1dd4-4359-bbfc-b78907d20754	CHOFER CAMION RESIDUOS	2026-03-27 14:04:54.296626+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
968864cd-806d-49d8-aee0-12904862f7a5	MUSIN	\N	632 75 20 48	conductor_camion	t	\N	82115d30-ee94-4b37-a2bf-a96bcaece49e	\N	2026-03-27 14:05:39.893398+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
5ce4ca44-b298-4764-9002-ab54bbc7b553	FELIPE	\N	649 62 27 10	encargado	t	\N	9af949fe-3876-40f3-88e5-9c4c8a6fbb50	ENCARGADO ALMACEN	2026-03-27 14:06:08.030905+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
231ef23d-826b-4c51-ad9d-f1be75de36e9	PEDRO	\N	697 22 46 99	encargado	t	\N	d5b9ea10-702d-4cb6-87a6-b70237e131fd	RECOGIDA DE DATOS CAMPO	2026-03-27 14:06:52.712629+00	\N	\N	2026-04-03	\N	\N	f	\N	\N
5f6f84c3-da3f-4e6f-b356-8a79e6149ef8	Chafiz	\N	632481145	encargado	t	\N	175b6504-497d-44cd-bf94-3089cb1f11f2	\N	2026-04-04 08:23:50.050462+00	\N	EN001	2026-04-04	\N	\N	f	\N	\N
\.


--
-- Data for Name: logistica_combustible; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logistica_combustible" ("id", "vehiculo_tipo", "vehiculo_id", "conductor_id", "fecha", "litros", "coste_total", "gasolinera", "foto_url", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: logistica_conductores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logistica_conductores" ("id", "nombre", "telefono", "activo", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: logistica_inventario_sync; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logistica_inventario_sync" ("id", "tipo", "vehiculo_id", "ubicacion_id", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: logistica_mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logistica_mantenimiento" ("id", "camion_id", "tipo", "descripcion", "fecha", "coste_euros", "proveedor", "foto_url", "created_at", "created_by", "foto_url_2") FROM stdin;
\.


--
-- Data for Name: logistica_viajes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."logistica_viajes" ("id", "conductor_id", "camion_id", "finca", "trabajo_realizado", "ruta", "hora_salida", "hora_llegada", "gasto_gasolina_litros", "gasto_gasolina_euros", "km_recorridos", "notas", "created_at", "created_by", "destino", "personal_id") FROM stdin;
\.


--
-- Data for Name: maquinaria_aperos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."maquinaria_aperos" ("id", "tipo", "descripcion", "tractor_id", "activo", "foto_url", "notas", "codigo_interno", "estado", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: maquinaria_inventario_sync; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."maquinaria_inventario_sync" ("id", "tipo", "maquinaria_id", "ubicacion_id", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: maquinaria_mantenimiento; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."maquinaria_mantenimiento" ("id", "tractor_id", "tipo", "descripcion", "fecha", "horas_motor_al_momento", "coste_euros", "proveedor", "foto_url", "created_at", "created_by", "foto_url_2") FROM stdin;
\.


--
-- Data for Name: maquinaria_uso; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."maquinaria_uso" ("id", "tractor_id", "apero_id", "tractorista", "personal_id", "finca", "parcel_id", "tipo_trabajo", "fecha", "hora_inicio", "hora_fin", "horas_trabajadas", "gasolina_litros", "foto_url", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: palots; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."palots" ("id", "qr_code", "parcel_id", "harvest_id", "cultivo", "lote", "peso_kg", "camara_id", "posicion_camara", "estado", "created_at") FROM stdin;
53dcdb1c-a291-4b80-99b3-f109d0ebe4b6	PLT-513351-37	concepcion-s10b	\N	\N	\N	\N	\N	\N	expedido	2026-04-08 16:08:33.467367+00
\.


--
-- Data for Name: movimientos_palot; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."movimientos_palot" ("id", "palot_id", "camion_id", "tipo", "timestamp", "latitud", "longitud", "operador", "notas", "created_at") FROM stdin;
423afbd0-20b4-4d3e-bd7c-c6c4aca5ad1c	53dcdb1c-a291-4b80-99b3-f109d0ebe4b6	\N	carga_campo	2026-04-08 16:10:10.535052+00	38.1056888	-0.9414685	oscar	\N	2026-04-08 16:10:10.535052+00
fbc7ad63-8444-4a3c-a6da-b14db660b6d8	53dcdb1c-a291-4b80-99b3-f109d0ebe4b6	\N	carga_campo	2026-04-08 16:10:24.417377+00	38.1056888	-0.9414685	x	\N	2026-04-08 16:10:24.417377+00
95d71554-826d-442c-b2c8-17c903e116fc	53dcdb1c-a291-4b80-99b3-f109d0ebe4b6	\N	descarga_almacen	2026-04-08 16:11:40.585419+00	38.1056888	-0.9414685	mustafa	\N	2026-04-08 16:11:40.585419+00
dd3481d4-be8e-452c-b03c-aafb09eb9a3f	53dcdb1c-a291-4b80-99b3-f109d0ebe4b6	\N	salida_expedicion	2026-04-08 17:25:15.92136+00	38.1487644	-0.9235661	juanpe	\N	2026-04-08 17:25:15.92136+00
\.


--
-- Data for Name: parcel_photos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parcel_photos" ("id", "parcel_id", "image_url", "description", "created_at") FROM stdin;
\.


--
-- Data for Name: parcel_production; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parcel_production" ("parcel_id", "crop", "area_hectares", "estimated_production_kg", "estimated_plastic_kg", "estimated_drip_meters", "estimated_cost") FROM stdin;
\.


--
-- Data for Name: parte_estado_finca; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parte_estado_finca" ("id", "parte_id", "finca", "parcel_id", "estado", "num_operarios", "nombres_operarios", "foto_url", "foto_url_2", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: parte_personal; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parte_personal" ("id", "parte_id", "texto", "con_quien", "donde", "fecha_hora", "created_at", "foto_url", "created_by") FROM stdin;
\.


--
-- Data for Name: parte_residuos_vegetales; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parte_residuos_vegetales" ("id", "parte_id", "nombre_conductor", "hora_salida_nave", "nombre_ganadero", "hora_llegada_ganadero", "hora_regreso_nave", "notas_descarga", "created_at", "foto_url", "personal_id", "ganadero_id", "created_by") FROM stdin;
\.


--
-- Data for Name: parte_trabajo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."parte_trabajo" ("id", "parte_id", "tipo_trabajo", "finca", "ambito", "parcelas", "num_operarios", "nombres_operarios", "hora_inicio", "hora_fin", "foto_url", "foto_url_2", "notas", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: personal_externo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."personal_externo" ("id", "nombre_empresa", "nif", "telefono_contacto", "tipo", "activo", "qr_code", "notas", "created_at", "created_by", "codigo_interno", "persona_contacto", "presupuesto", "trabajos_realiza") FROM stdin;
\.


--
-- Data for Name: personal_tipos_trabajo; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."personal_tipos_trabajo" ("id", "personal_id", "tipo_trabajo_id", "created_at") FROM stdin;
d9c6a8f3-5b96-4910-971d-48ea91242f63	5f27a66b-900c-4340-a73f-f01b130c5837	866dbe85-b0da-4914-a7d2-1646119e67d3	2026-04-04 23:31:10.194267+00
4d074872-9e08-47ae-aa8f-8fcd2d9bb30a	5f27a66b-900c-4340-a73f-f01b130c5837	be328ebf-3835-4067-9d54-1fc1ff7b7bc3	2026-04-04 23:32:32.045457+00
\.


--
-- Data for Name: planificacion_campana; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."planificacion_campana" ("id", "finca", "parcel_id", "cultivo", "fecha_prevista_plantacion", "fecha_estimada_cosecha", "recursos_estimados", "observaciones", "estado", "created_at", "created_by", "updated_at") FROM stdin;
\.


--
-- Data for Name: plantings; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."plantings" ("id", "parcel_id", "date", "crop", "notes", "created_at", "variedad", "marco_cm_entre_lineas", "marco_cm_entre_plantas", "num_plantas_real", "lote_semilla", "proveedor_semilla", "fecha_cosecha_estimada", "sistema_riego") FROM stdin;
4acebfe7-9ae0-47d6-8c40-e2b8168b8d3b	la-barda-s12	2025-11-14	brocoli	\N	2026-04-07 13:58:09.959299+00	ULYSES	100.00	40.00	\N	\N	\N	2026-02-12	goteo
8e2cf5b7-2d7f-4838-9086-9a291f463e3f	la-barda-s12	2025-11-14	brocoli	\N	2026-04-07 14:06:36.266692+00	MONRELLO	100.00	40.00	\N	\N	\N	2026-02-12	goteo
85995f3e-54e7-4d03-802b-48b7589f8e4b	collados-s1	2025-09-10	broccoli	\N	2026-04-07 14:11:56.506716+00	ARES	100.00	40.00	\N	\N	\N	2025-12-09	goteo
\.


--
-- Data for Name: work_records; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."work_records" ("id", "parcel_id", "date", "work_type", "workers", "hours", "description", "created_at", "cuadrilla_id", "hora_entrada", "hora_salida", "qr_scan_timestamp", "qr_scan_entrada", "qr_scan_salida", "horas_calculadas") FROM stdin;
\.


--
-- Data for Name: presencia_tiempo_real; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."presencia_tiempo_real" ("id", "cuadrilla_id", "parcel_id", "work_record_id", "hora_entrada", "hora_salida", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: proveedores_precios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."proveedores_precios" ("id", "proveedor_id", "producto", "unidad", "precio_unitario", "fecha_vigencia", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: registros_estado_parcela; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."registros_estado_parcela" ("id", "parcel_id", "fecha", "estado", "cultivo", "observaciones", "foto_url") FROM stdin;
e8b31d09-5b24-4ee0-9e91-177eb3a570b1	la-barda-s12	2026-04-07 13:58:09.474145+00	plantada	\N	76 B 0.54Ha 1x0.25	\N
4d6f471d-132c-48a0-a800-c6df3aff90e3	la-barda-s12	2026-04-07 14:06:35.947787+00	plantada	\N	373 B 2.6Ha 1x0.25	\N
f1d46bd7-2d6f-4e93-b755-99e7c9f8e754	collados-s1	2026-04-07 14:11:56.163569+00	plantada	\N	386 B 2.76Ha 1x0.25	\N
73e5d9e1-df9c-4d01-b770-36f757026b51	collados-s1	2026-04-07 14:16:52.36975+00	cosechada	\N	\N	\N
\.


--
-- Data for Name: sistema_riego_zonas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."sistema_riego_zonas" ("id", "parcel_id", "nombre_zona", "tipo_riego", "area_ha", "caudal_nominal_lh", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: registros_riego; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."registros_riego" ("id", "zona_id", "parcel_id", "fecha_inicio", "fecha_fin", "litros_aplicados", "presion_bar", "origen_agua", "operador", "notas", "created_at") FROM stdin;
\.


--
-- Data for Name: residuos_operacion; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."residuos_operacion" ("id", "parcel_id", "operacion_id", "tipo_residuo", "kg_instalados", "kg_retirados", "proveedor", "lote_material", "gestor_residuos", "fecha_instalacion", "fecha_retirada", "created_at") FROM stdin;
\.


--
-- Data for Name: tickets_pesaje; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tickets_pesaje" ("id", "harvest_id", "camion_id", "matricula_manual", "destino", "peso_bruto_kg", "peso_tara_kg", "conductor", "hora_salida", "numero_albaran", "observaciones", "created_at") FROM stdin;
\.


--
-- Data for Name: trabajos_incidencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."trabajos_incidencias" ("id", "urgente", "titulo", "descripcion", "finca", "parcel_id", "estado", "foto_url", "fecha", "fecha_resolucion", "notas_resolucion", "created_at", "created_by") FROM stdin;
\.


--
-- Data for Name: trabajos_registro; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."trabajos_registro" ("id", "tipo_bloque", "fecha", "hora_inicio", "hora_fin", "finca", "parcel_id", "tipo_trabajo", "num_operarios", "nombres_operarios", "foto_url", "notas", "created_at", "created_by", "estado_planificacion", "prioridad", "fecha_planificada", "fecha_original", "tractor_id", "apero_id") FROM stdin;
\.


--
-- Data for Name: tractores; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."tractores" ("id", "codigo", "matricula", "marca", "ubicacion", "estado", "created_at", "updated_at") FROM stdin;
2c6d183b-d6e0-4df2-b759-efed43e801ce	TR	6237-BBN	AGRIA	CONCEPCION	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
cca36f05-5ccc-4f12-ad95-f3436d696901	TR	3453-BHW	CASE MAXXUM	CONCEPCION	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
517aa634-6c5e-459a-ab7e-f93821dc34d6	TR	9772-BFM	KUBOTA	CIEZA	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
f37ded32-b150-4448-ace4-047b3e98e243	TR-1	MU-46835-VE	MASSEY FERGUSON	CIEZA	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
f0efd428-faf9-4537-9307-7fda0f582893	TR-3	E-0931-BBX	JOHN DEERE	BARDA	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
2e394b07-de71-4c31-beb8-884f2780a5e3	TR-4	E-1611-BDS	VALTRA	CIEZA	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
550d8f8f-181a-44f2-a3e9-579727c17773	TR-6	E-6393-BFH	VALTRA	CIEZA	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
3b945b26-5d3c-4ddc-8d3d-fd68d1ece2bc	TR-7	4565-BGB	JOHN DEERE	CONCEPCION	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
8beb741a-f458-4432-ab49-79d0957ae3e5	TR-9	3853-BGM	JOHN DEERE	CONCEPCION	disponible	2026-03-29 19:12:58.352822	2026-03-29 19:12:58.352822
\.


--
-- Data for Name: trazabilidad_registros; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."trazabilidad_registros" ("id", "finca", "lote", "cultivo", "fase_produccion", "fecha_inicio", "fecha_fin", "notas", "foto_url", "estado", "created_at", "updated_at", "created_by") FROM stdin;
\.


--
-- Data for Name: usuario_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."usuario_roles" ("id", "user_id", "rol", "activo", "created_at") FROM stdin;
\.


--
-- Data for Name: vehicle_positions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."vehicle_positions" ("id", "vehicle_id", "vehicle_tipo", "timestamp", "latitud", "longitud", "velocidad_kmh", "parcel_id_detectada", "estado") FROM stdin;
\.


--
-- Data for Name: vehiculos_empresa; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."vehiculos_empresa" ("id", "codigo_interno", "matricula", "marca", "modelo", "anio", "tipo", "conductor_habitual_id", "km_actuales", "estado_operativo", "fecha_proxima_itv", "fecha_proxima_revision", "foto_url", "notas", "gps_info", "created_at", "created_by") FROM stdin;
b30b66ca-32d2-4a51-b749-69a7c5040021	VH001	1235BCH	Fiat	Ducato	2006	furgoneta	da88ba77-dcdf-4317-85ed-7e765c2ad573	430	disponible	2026-04-10	2026-09-14	\N	\N	\N	2026-04-04 23:30:03.724412+00	JuanPe
\.


--
-- Data for Name: vuelos_dron; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."vuelos_dron" ("id", "parcel_id", "fecha_vuelo", "url_imagen", "observaciones") FROM stdin;
\.


--
-- Data for Name: work_records_cuadrillas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY "public"."work_records_cuadrillas" ("id", "work_record_id", "cuadrilla_id", "num_trabajadores", "hora_entrada", "hora_salida", "created_at") FROM stdin;
\.


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets" ("id", "name", "owner", "created_at", "updated_at", "public", "avif_autodetection", "file_size_limit", "allowed_mime_types", "owner_id", "type") FROM stdin;
parcel-images	parcel-images	\N	2026-03-14 00:04:37.635995+00	2026-03-14 00:04:37.635995+00	t	f	\N	\N	\N	STANDARD
inventario-images	inventario-images	\N	2026-03-24 21:47:50.467777+00	2026-03-24 21:47:50.467777+00	t	f	\N	\N	\N	STANDARD
partes-images	partes-images	\N	2026-03-25 20:55:43.200935+00	2026-03-25 20:55:43.200935+00	t	f	\N	\N	\N	STANDARD
\.


--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_analytics" ("name", "type", "format", "created_at", "updated_at", "id", "deleted_at") FROM stdin;
\.


--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."buckets_vectors" ("id", "type", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."objects" ("id", "bucket_id", "name", "owner", "created_at", "updated_at", "last_accessed_at", "metadata", "version", "owner_id", "user_metadata") FROM stdin;
77429566-25cd-4405-bff4-bd9a1da07bd2	parcel-images	.emptyFolderPlaceholder	\N	2026-03-25 19:14:25.680492+00	2026-03-25 19:14:25.680492+00	2026-03-25 19:14:25.680492+00	{"eTag": "\\"d41d8cd98f00b204e9800998ecf8427e\\"", "size": 0, "mimetype": "application/octet-stream", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T19:14:25.679Z", "contentLength": 0, "httpStatusCode": 200}	e5dfc9a8-e3e7-423f-b654-e176e96f8717	\N	{}
79c97cae-b656-456c-b2cd-3cfcf86cc3e6	partes-images	70d6ab37-e21d-4948-bca4-771fa28293d4/1774474955611-wuxwblcdc5g.png	\N	2026-03-25 21:42:36.14085+00	2026-03-25 21:42:36.14085+00	2026-03-25 21:42:36.14085+00	{"eTag": "\\"723d5c419477c26eebefc2090cee90a5\\"", "size": 1073138, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T21:42:37.000Z", "contentLength": 1073138, "httpStatusCode": 200}	e6e9ebaa-c86f-43e9-a3cc-34327d951d0d	\N	{}
bfbd8456-49e7-489a-8243-479ae6fbef3a	partes-images	70d6ab37-e21d-4948-bca4-771fa28293d4/1774474956207-dpouut2yv8j.png	\N	2026-03-25 21:42:36.653348+00	2026-03-25 21:42:36.653348+00	2026-03-25 21:42:36.653348+00	{"eTag": "\\"cc245c3485da7dd33c657f62befbf92f\\"", "size": 1024792, "mimetype": "image/png", "cacheControl": "max-age=3600", "lastModified": "2026-03-25T21:42:37.000Z", "contentLength": 1024792, "httpStatusCode": 200}	cbb771f0-5bb4-4609-a174-2a3d49471c52	\N	{}
a8733ecb-0f52-410e-8641-2a05ca506abe	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774911169661.jpg	\N	2026-03-30 22:52:50.371511+00	2026-03-30 22:52:50.371511+00	2026-03-30 22:52:50.371511+00	{"eTag": "\\"30e016ea13eaccb3a1871d5aadfd5e8a\\"", "size": 376584, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T22:52:51.000Z", "contentLength": 376584, "httpStatusCode": 200}	a4085c75-811a-4460-84c1-512d9fd2fe3c	\N	{}
09128a5b-a4f4-4ab2-b448-b9bae80fa26f	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774911416434.jpg	\N	2026-03-30 22:56:57.174177+00	2026-03-30 22:56:57.174177+00	2026-03-30 22:56:57.174177+00	{"eTag": "\\"377f268eb86559ec5b7ec25e62b4dd55\\"", "size": 372735, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T22:56:57.000Z", "contentLength": 372735, "httpStatusCode": 200}	383d8f5c-36da-44d7-9e0f-94e72e4b653e	\N	{}
18340d6e-4f10-4945-afea-3642d2cad5fe	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774911613070.jpg	\N	2026-03-30 23:00:13.549834+00	2026-03-30 23:00:13.549834+00	2026-03-30 23:00:13.549834+00	{"eTag": "\\"4977024b5858c7cd7389c31425b7b148\\"", "size": 464553, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:00:14.000Z", "contentLength": 464553, "httpStatusCode": 200}	eacb05e2-5e98-43de-8567-9e5f54fae213	\N	{}
43e5b348-30bb-45fc-9a96-e34447cee808	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774911713770.jpg	\N	2026-03-30 23:01:54.644875+00	2026-03-30 23:01:54.644875+00	2026-03-30 23:01:54.644875+00	{"eTag": "\\"0b0b73821875e3e6a603f5bc0c907037\\"", "size": 225539, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:01:55.000Z", "contentLength": 225539, "httpStatusCode": 200}	82773a6a-16af-4625-bd14-e6b20ac02be7	\N	{}
715f075d-c9d9-48d5-95eb-ef6ae1d9fa5f	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912066034.jpg	\N	2026-03-30 23:07:46.432413+00	2026-03-30 23:07:46.432413+00	2026-03-30 23:07:46.432413+00	{"eTag": "\\"8e18f411dc1296990f7f1d80f3ae9fba\\"", "size": 330045, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:07:47.000Z", "contentLength": 330045, "httpStatusCode": 200}	83045b6b-a63c-4da3-806a-954291f3ea5e	\N	{}
4683f75c-7e95-45e0-af31-894fa2d20b78	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912265136.jpg	\N	2026-03-30 23:11:05.754234+00	2026-03-30 23:11:05.754234+00	2026-03-30 23:11:05.754234+00	{"eTag": "\\"d00e5f40f907324d2a265bd42530b59d\\"", "size": 287754, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:11:06.000Z", "contentLength": 287754, "httpStatusCode": 200}	b24249b2-7bda-4bbc-a07a-7171f425877c	\N	{}
c348b9ab-ceb6-4774-9f71-e3bdcadc8585	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912350104.jpg	\N	2026-03-30 23:12:30.477993+00	2026-03-30 23:12:30.477993+00	2026-03-30 23:12:30.477993+00	{"eTag": "\\"f476ce95e24075262ab5fd6146f6b838\\"", "size": 346478, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:12:31.000Z", "contentLength": 346478, "httpStatusCode": 200}	38a32a59-115e-4bd5-a734-f5749045c858	\N	{}
f592426d-add2-444c-846b-5c4b10b1db34	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912513005.jpg	\N	2026-03-30 23:15:13.997143+00	2026-03-30 23:15:13.997143+00	2026-03-30 23:15:13.997143+00	{"eTag": "\\"0c57fb9cb8c10b412728ba85bd003235\\"", "size": 221613, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:15:14.000Z", "contentLength": 221613, "httpStatusCode": 200}	7b3da76f-ff1a-4649-86a9-e8504cc3f855	\N	{}
f668ef1b-78e1-4f66-99de-a0e2d352694b	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912651543.jpg	\N	2026-03-30 23:17:32.095314+00	2026-03-30 23:17:32.095314+00	2026-03-30 23:17:32.095314+00	{"eTag": "\\"cfa553c0bc60d24ce3c296c5dd40dcca\\"", "size": 352612, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:17:32.000Z", "contentLength": 352612, "httpStatusCode": 200}	a7ac18e4-50b6-4db5-90ad-4baa9fbe0a26	\N	{}
e2172847-0978-4e34-92e0-4d956be861ec	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774912955190.jpg	\N	2026-03-30 23:22:35.770376+00	2026-03-30 23:22:35.770376+00	2026-03-30 23:22:35.770376+00	{"eTag": "\\"5e128be9fac14455c45d870300934b91\\"", "size": 324211, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:22:36.000Z", "contentLength": 324211, "httpStatusCode": 200}	99a5410e-a1d3-4571-8fac-3060c0d90303	\N	{}
a0c65ab5-624a-4639-bbab-8c920d159929	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774913113435.jpg	\N	2026-03-30 23:25:14.17026+00	2026-03-30 23:25:14.17026+00	2026-03-30 23:25:14.17026+00	{"eTag": "\\"e08a989168b837b3707cdd04dcea8fd1\\"", "size": 324744, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:25:15.000Z", "contentLength": 324744, "httpStatusCode": 200}	af66b4cd-8580-4f6d-b366-2375bc47cf2c	\N	{}
fb74de62-dbbe-43cb-86a2-89ef9932cae9	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774913153307.jpg	\N	2026-03-30 23:25:54.204463+00	2026-03-30 23:25:54.204463+00	2026-03-30 23:25:54.204463+00	{"eTag": "\\"9d7be4f5c3a6aceeccaa6a1ff7efe987\\"", "size": 198308, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:25:55.000Z", "contentLength": 198308, "httpStatusCode": 200}	f5e2562e-b698-45f5-bf5c-2a067e21fbb7	\N	{}
94012694-75d5-4f80-a65c-91faecb4c013	inventario-images	c4d6e3db-4409-46f0-a749-3f3b033fe5d7/3c13b986-79a9-4eda-b58a-3bd1fe794f1c/lote_1774913228936.jpg	\N	2026-03-30 23:27:09.481558+00	2026-03-30 23:27:09.481558+00	2026-03-30 23:27:09.481558+00	{"eTag": "\\"360a84def904c3f8ddd09c7dbb05600d\\"", "size": 128503, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-03-30T23:27:10.000Z", "contentLength": 128503, "httpStatusCode": 200}	7f7a3cff-47dc-4119-a522-9f115246fee9	\N	{}
fa2f844a-e18a-4bce-87f1-1ac568525ccc	partes-images	c620ce32-b4f3-44a8-aba2-6b8e2a529b39/1775291707647-iwd8mk6bjyb.jpg	\N	2026-04-04 08:35:08.415228+00	2026-04-04 08:35:08.415228+00	2026-04-04 08:35:08.415228+00	{"eTag": "\\"5047b4b0f5662b67e3c52abc11121edc\\"", "size": 746679, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:35:09.000Z", "contentLength": 746679, "httpStatusCode": 200}	089b05f3-d247-4e9f-b3b6-ac7f9857ce36	\N	{}
f969fa97-1d96-4cda-b043-970a38a80db5	partes-images	c620ce32-b4f3-44a8-aba2-6b8e2a529b39/1775291711116-s0chnv02n8.jpg	\N	2026-04-04 08:35:11.915085+00	2026-04-04 08:35:11.915085+00	2026-04-04 08:35:11.915085+00	{"eTag": "\\"5047b4b0f5662b67e3c52abc11121edc\\"", "size": 746679, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:35:12.000Z", "contentLength": 746679, "httpStatusCode": 200}	7717af31-b65e-4e95-b841-6268d8592ee5	\N	{}
8ded0fce-12f0-464d-b1df-b044f6670124	parcel-images	logistica-vehiculo/1775292339836-993bjlzwowk.jpg	\N	2026-04-04 08:45:42.381079+00	2026-04-04 08:45:42.381079+00	2026-04-04 08:45:42.381079+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:45:43.000Z", "contentLength": 7483930, "httpStatusCode": 200}	484ba91b-a7c9-482e-b38a-dc795873bc62	\N	{}
18dd09b6-625a-4e25-b6cf-cdeb0ae0030c	parcel-images	logistica-vehiculo/1775292340808-wcf3khwv0ds.jpg	\N	2026-04-04 08:45:43.5485+00	2026-04-04 08:45:43.5485+00	2026-04-04 08:45:43.5485+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:45:44.000Z", "contentLength": 7483930, "httpStatusCode": 200}	9b645aee-3644-46f9-bce4-75f9dc5f0704	\N	{}
8284de30-af5f-4c52-bbc1-db8c89fe8998	parcel-images	logistica-vehiculo/1775292341930-ystcxx5yeip.jpg	\N	2026-04-04 08:45:44.894863+00	2026-04-04 08:45:44.894863+00	2026-04-04 08:45:44.894863+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:45:45.000Z", "contentLength": 7483930, "httpStatusCode": 200}	ef73d308-2fc8-4770-973c-57177f853ecf	\N	{}
e2c57245-a9f7-426c-b72f-171b9e5e5a70	parcel-images	logistica-vehiculo/1775292365920-owakeubwzbf.jpg	\N	2026-04-04 08:46:09.631121+00	2026-04-04 08:46:09.631121+00	2026-04-04 08:46:09.631121+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:10.000Z", "contentLength": 7483930, "httpStatusCode": 200}	480a3ad8-2719-4750-924a-c11d1e45ea98	\N	{}
659d3f8f-c0be-4d12-8dcc-71f2df3d6dcc	parcel-images	logistica-vehiculo/1775292366664-afy18spcwwl.jpg	\N	2026-04-04 08:46:10.901638+00	2026-04-04 08:46:10.901638+00	2026-04-04 08:46:10.901638+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:11.000Z", "contentLength": 7483930, "httpStatusCode": 200}	57475c20-5ed4-437d-98db-a2ed33107884	\N	{}
7be44448-d722-42e0-9308-89a2332285a0	parcel-images	logistica-vehiculo/1775292366497-je6g3z291q.jpg	\N	2026-04-04 08:46:11.029772+00	2026-04-04 08:46:11.029772+00	2026-04-04 08:46:11.029772+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:11.000Z", "contentLength": 7483930, "httpStatusCode": 200}	ecaf99dc-0f95-402e-8887-28af57edb683	\N	{}
eb74c44c-0247-4ea3-bb2a-a0ec1fd5f4d3	parcel-images	logistica-vehiculo/1775292401474-3bwzj0h8vm3.jpg	\N	2026-04-04 08:46:44.611147+00	2026-04-04 08:46:44.611147+00	2026-04-04 08:46:44.611147+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:45.000Z", "contentLength": 7483930, "httpStatusCode": 200}	09f19978-2614-47ad-b411-cb9fe113c900	\N	{}
0d919d76-938a-4565-b2a5-ba3f6b240e96	parcel-images	logistica-vehiculo/1775292402065-fi5yidjckm.jpg	\N	2026-04-04 08:46:45.063343+00	2026-04-04 08:46:45.063343+00	2026-04-04 08:46:45.063343+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:45.000Z", "contentLength": 7483930, "httpStatusCode": 200}	a3132a3c-4fab-48e6-bf1c-9fd63efca781	\N	{}
1a34770e-529b-44d3-a138-c96c246e52fd	parcel-images	logistica-vehiculo/1775292414850-lm5clehouc.jpg	\N	2026-04-04 08:46:59.345294+00	2026-04-04 08:46:59.345294+00	2026-04-04 08:46:59.345294+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:46:59.000Z", "contentLength": 7483930, "httpStatusCode": 200}	55de8690-afa1-4ee2-aac4-a4ccfb89bfbe	\N	{}
7310bc44-f149-4035-a5c0-160b3848e895	parcel-images	logistica-vehiculo/1775292415377-nlorwze14kr.jpg	\N	2026-04-04 08:47:00.687929+00	2026-04-04 08:47:00.687929+00	2026-04-04 08:47:00.687929+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:47:01.000Z", "contentLength": 7483930, "httpStatusCode": 200}	9fc66142-9119-4525-8330-c14e0d4d7c13	\N	{}
3f3ca42e-81eb-4f2a-8df8-4489f0242153	parcel-images	logistica-vehiculo/1775292415739-5nemn4od13o.jpg	\N	2026-04-04 08:47:00.900688+00	2026-04-04 08:47:00.900688+00	2026-04-04 08:47:00.900688+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:47:01.000Z", "contentLength": 7483930, "httpStatusCode": 200}	09885f38-b4ae-40bb-ad23-5cbfa9abc900	\N	{}
443a63e4-1b9e-41d7-98ca-b925f399fefd	parcel-images	logistica-vehiculo/1775292415578-gzzd8bme62h.jpg	\N	2026-04-04 08:47:01.427557+00	2026-04-04 08:47:01.427557+00	2026-04-04 08:47:01.427557+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:47:01.000Z", "contentLength": 7483930, "httpStatusCode": 200}	27466eb0-d909-42f5-bd02-43d2cca548e9	\N	{}
4b3f1f62-76ee-46da-81f9-0781e9b29aa9	parcel-images	logistica-vehiculo/1775292423456-whi755by8k.jpg	\N	2026-04-04 08:47:06.559234+00	2026-04-04 08:47:06.559234+00	2026-04-04 08:47:06.559234+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:47:07.000Z", "contentLength": 7483930, "httpStatusCode": 200}	acc14a22-9126-458f-a321-e91dedbfe955	\N	{}
b67ec3e2-024f-48f2-9477-f1899312afbd	parcel-images	logistica-vehiculo/1775292423688-363hapiajgb.jpg	\N	2026-04-04 08:47:06.683915+00	2026-04-04 08:47:06.683915+00	2026-04-04 08:47:06.683915+00	{"eTag": "\\"4dcd68bcd8c5d646a185386cc3d309d4-2\\"", "size": 7483930, "mimetype": "image/jpeg", "cacheControl": "max-age=3600", "lastModified": "2026-04-04T08:47:07.000Z", "contentLength": 7483930, "httpStatusCode": 200}	7b57cde1-8027-404d-a06b-475fd7453dcf	\N	{}
\.


--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads" ("id", "in_progress_size", "upload_signature", "bucket_id", "key", "version", "owner_id", "created_at", "user_metadata", "metadata") FROM stdin;
\.


--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."s3_multipart_uploads_parts" ("id", "upload_id", "size", "part_number", "bucket_id", "key", "etag", "owner_id", "version", "created_at") FROM stdin;
\.


--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--

COPY "storage"."vector_indexes" ("id", "name", "bucket_id", "data_type", "dimension", "distance_metric", "metadata_configuration", "created_at", "updated_at") FROM stdin;
\.


--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--

COPY "supabase_functions"."hooks" ("id", "hook_table_id", "hook_name", "created_at", "request_id") FROM stdin;
\.


--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 49, true);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict v2BNJYI0Tgon2X5SQEYiuqYW3wRjadArepFcdHWagYK7SZ3qzjFU0EoqYpRzNJC

RESET ALL;
