CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";
CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";
CREATE EXTENSION IF NOT EXISTS "plpgsql" WITH SCHEMA "pg_catalog";
CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";
--
-- PostgreSQL database dump
--


-- Dumped from database version 17.6
-- Dumped by pg_dump version 18.1

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
-- Name: public; Type: SCHEMA; Schema: -; Owner: -
--



--
-- Name: app_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.app_role AS ENUM (
    'admin',
    'moderator',
    'user'
);


--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'name');
  
  INSERT INTO public.inventories (user_id, name)
  VALUES (NEW.id, 'My Inventory');
  
  RETURN NEW;
END;
$$;


--
-- Name: has_role(uuid, public.app_role); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_role(_user_id uuid, _role public.app_role) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;


SET default_table_access_method = heap;

--
-- Name: bookings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bookings (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    mover_id uuid,
    move_id uuid,
    status text DEFAULT 'pending'::text NOT NULL,
    quoted_price integer,
    final_price integer,
    notes text,
    scheduled_date timestamp with time zone,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    payment_status text DEFAULT 'pending'::text,
    payment_intent_id text,
    stripe_session_id text,
    CONSTRAINT bookings_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'confirmed'::text, 'in_progress'::text, 'completed'::text, 'cancelled'::text])))
);


--
-- Name: inventories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.inventories (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid,
    name text,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: items; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.items (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    category text,
    room text,
    image_url text,
    qr_code text,
    packed boolean DEFAULT false,
    fragile boolean DEFAULT false,
    weight numeric,
    meta jsonb,
    inventory_id uuid,
    move_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: mover_reviews; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mover_reviews (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mover_id uuid NOT NULL,
    user_id uuid NOT NULL,
    rating integer NOT NULL,
    comment text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT mover_reviews_rating_check CHECK (((rating >= 1) AND (rating <= 5)))
);


--
-- Name: mover_services; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mover_services (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    mover_id uuid NOT NULL,
    service text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: movers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.movers (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    name text NOT NULL,
    description text,
    logo_url text,
    rating numeric(2,1) DEFAULT 0.0,
    review_count integer DEFAULT 0,
    price_range text,
    min_price integer DEFAULT 0,
    location text,
    response_time text,
    verified boolean DEFAULT false,
    insured boolean DEFAULT false,
    available boolean DEFAULT true,
    phone text,
    email text,
    website text,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT movers_price_range_check CHECK ((price_range = ANY (ARRAY['$'::text, '$$'::text, '$$$'::text, '$$$$'::text])))
);


--
-- Name: moves; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.moves (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    name text NOT NULL,
    pickup_address text,
    delivery_address text,
    move_date timestamp with time zone,
    status text DEFAULT 'planning'::text,
    inventory_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    cancelled_at timestamp with time zone,
    cancellation_reason text
);


--
-- Name: profiles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.profiles (
    id uuid NOT NULL,
    email text,
    name text,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    role public.app_role NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);


--
-- Name: bookings bookings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_pkey PRIMARY KEY (id);


--
-- Name: inventories inventories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_pkey PRIMARY KEY (id);


--
-- Name: items items_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_pkey PRIMARY KEY (id);


--
-- Name: mover_reviews mover_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mover_reviews
    ADD CONSTRAINT mover_reviews_pkey PRIMARY KEY (id);


--
-- Name: mover_services mover_services_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mover_services
    ADD CONSTRAINT mover_services_pkey PRIMARY KEY (id);


--
-- Name: movers movers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.movers
    ADD CONSTRAINT movers_pkey PRIMARY KEY (id);


--
-- Name: moves moves_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moves
    ADD CONSTRAINT moves_pkey PRIMARY KEY (id);


--
-- Name: profiles profiles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (id);


--
-- Name: user_roles user_roles_user_id_role_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_role_key UNIQUE (user_id, role);


--
-- Name: idx_bookings_payment_intent; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_payment_intent ON public.bookings USING btree (payment_intent_id);


--
-- Name: idx_bookings_stripe_session; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_bookings_stripe_session ON public.bookings USING btree (stripe_session_id);


--
-- Name: bookings bookings_move_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_move_id_fkey FOREIGN KEY (move_id) REFERENCES public.moves(id) ON DELETE CASCADE;


--
-- Name: bookings bookings_mover_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_mover_id_fkey FOREIGN KEY (mover_id) REFERENCES public.movers(id) ON DELETE SET NULL;


--
-- Name: bookings bookings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bookings
    ADD CONSTRAINT bookings_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: inventories inventories_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.inventories
    ADD CONSTRAINT inventories_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: items items_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id) ON DELETE CASCADE;


--
-- Name: items items_move_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.items
    ADD CONSTRAINT items_move_id_fkey FOREIGN KEY (move_id) REFERENCES public.moves(id) ON DELETE SET NULL;


--
-- Name: mover_reviews mover_reviews_mover_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mover_reviews
    ADD CONSTRAINT mover_reviews_mover_id_fkey FOREIGN KEY (mover_id) REFERENCES public.movers(id) ON DELETE CASCADE;


--
-- Name: mover_reviews mover_reviews_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mover_reviews
    ADD CONSTRAINT mover_reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mover_services mover_services_mover_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mover_services
    ADD CONSTRAINT mover_services_mover_id_fkey FOREIGN KEY (mover_id) REFERENCES public.movers(id) ON DELETE CASCADE;


--
-- Name: moves moves_inventory_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moves
    ADD CONSTRAINT moves_inventory_id_fkey FOREIGN KEY (inventory_id) REFERENCES public.inventories(id) ON DELETE SET NULL;


--
-- Name: moves moves_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.moves
    ADD CONSTRAINT moves_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: profiles profiles_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.profiles
    ADD CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;


--
-- Name: mover_services Admins can delete mover services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete mover services" ON public.mover_services FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movers Admins can delete movers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can delete movers" ON public.movers FOR DELETE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mover_services Admins can insert mover services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert mover services" ON public.mover_services FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movers Admins can insert movers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can insert movers" ON public.movers FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: user_roles Admins can manage roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can manage roles" ON public.user_roles USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mover_services Admins can update mover services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update mover services" ON public.mover_services FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: movers Admins can update movers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Admins can update movers" ON public.movers FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::public.app_role));


--
-- Name: mover_services Authenticated users can view mover services; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view mover services" ON public.mover_services FOR SELECT TO authenticated USING (true);


--
-- Name: movers Authenticated users can view movers; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Authenticated users can view movers" ON public.movers FOR SELECT TO authenticated USING (true);


--
-- Name: mover_reviews Mover reviews are publicly readable; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Mover reviews are publicly readable" ON public.mover_reviews FOR SELECT USING (true);


--
-- Name: bookings Users can create bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create bookings" ON public.bookings FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: inventories Users can create inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create inventories" ON public.inventories FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: moves Users can create moves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create moves" ON public.moves FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: mover_reviews Users can create reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can create reviews" ON public.mover_reviews FOR INSERT TO authenticated WITH CHECK ((auth.uid() = user_id));


--
-- Name: items Users can delete items in own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete items in own inventories" ON public.items FOR DELETE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.inventories
  WHERE ((inventories.id = items.inventory_id) AND (inventories.user_id = auth.uid())))));


--
-- Name: inventories Users can delete own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own inventories" ON public.inventories FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: moves Users can delete own moves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can delete own moves" ON public.moves FOR DELETE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: items Users can insert items in own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert items in own inventories" ON public.items FOR INSERT TO authenticated WITH CHECK ((EXISTS ( SELECT 1
   FROM public.inventories
  WHERE ((inventories.id = items.inventory_id) AND (inventories.user_id = auth.uid())))));


--
-- Name: profiles Users can insert own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK ((auth.uid() = id));


--
-- Name: items Users can update items in own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update items in own inventories" ON public.items FOR UPDATE TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.inventories
  WHERE ((inventories.id = items.inventory_id) AND (inventories.user_id = auth.uid())))));


--
-- Name: bookings Users can update own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own bookings" ON public.bookings FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: inventories Users can update own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own inventories" ON public.inventories FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: moves Users can update own moves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own moves" ON public.moves FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can update own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING ((auth.uid() = id));


--
-- Name: mover_reviews Users can update own reviews; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can update own reviews" ON public.mover_reviews FOR UPDATE TO authenticated USING ((auth.uid() = user_id));


--
-- Name: items Users can view items in own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view items in own inventories" ON public.items FOR SELECT TO authenticated USING ((EXISTS ( SELECT 1
   FROM public.inventories
  WHERE ((inventories.id = items.inventory_id) AND (inventories.user_id = auth.uid())))));


--
-- Name: bookings Users can view own bookings; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: inventories Users can view own inventories; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own inventories" ON public.inventories FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: moves Users can view own moves; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own moves" ON public.moves FOR SELECT TO authenticated USING ((auth.uid() = user_id));


--
-- Name: profiles Users can view own profile; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING ((auth.uid() = id));


--
-- Name: user_roles Users can view own roles; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING ((auth.uid() = user_id));


--
-- Name: bookings; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

--
-- Name: inventories; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.inventories ENABLE ROW LEVEL SECURITY;

--
-- Name: items; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.items ENABLE ROW LEVEL SECURITY;

--
-- Name: mover_reviews; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mover_reviews ENABLE ROW LEVEL SECURITY;

--
-- Name: mover_services; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.mover_services ENABLE ROW LEVEL SECURITY;

--
-- Name: movers; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.movers ENABLE ROW LEVEL SECURITY;

--
-- Name: moves; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.moves ENABLE ROW LEVEL SECURITY;

--
-- Name: profiles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

--
-- Name: user_roles; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

--
-- PostgreSQL database dump complete
--


