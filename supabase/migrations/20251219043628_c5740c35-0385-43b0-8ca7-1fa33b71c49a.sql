-- Add admin policies for moves table
CREATE POLICY "Admins can view all moves"
ON public.moves
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all moves"
ON public.moves
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for profiles table (to see user info)
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for bookings table
CREATE POLICY "Admins can view all bookings"
ON public.bookings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all bookings"
ON public.bookings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for inventories table (to see user inventories)
CREATE POLICY "Admins can view all inventories"
ON public.inventories
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies for items table
CREATE POLICY "Admins can view all items"
ON public.items
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));