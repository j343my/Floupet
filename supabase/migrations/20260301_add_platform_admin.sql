-- Add is_admin column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Drop existing policies on products if any, to avoid conflicts
DROP POLICY IF EXISTS "Public products are viewable by everyone" ON public.products;
DROP POLICY IF EXISTS "Authenticated users can insert products" ON public.products;
DROP POLICY IF EXISTS "Admins can update products" ON public.products;
DROP POLICY IF EXISTS "Admins can delete products" ON public.products;

-- Setup RLS for products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- 1. Everyone (authenticated or not) can READ products
CREATE POLICY "Public products are viewable by everyone" 
ON public.products FOR SELECT 
USING (true);

-- 2. Authenticated users can PROPOSE (insert) new products
CREATE POLICY "Authenticated users can insert products" 
ON public.products FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. Only Platform Admins can UPDATE products (approve, edit, etc.)
CREATE POLICY "Admins can update products" 
ON public.products FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);

-- 4. Only Platform Admins can DELETE products
CREATE POLICY "Admins can delete products" 
ON public.products FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid() AND profiles.is_admin = true
    )
);
