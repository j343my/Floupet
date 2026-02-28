// Floupet — Shared Types
// This file will be populated with entity types as we build Phase 1

export type Species = 'cat' | 'dog' | 'rabbit' | 'hamster' | 'bird' | 'fish' | 'reptile' | 'other';
export type Sex = 'male' | 'female' | 'unknown';
export type HouseholdRole = 'owner' | 'admin' | 'member' | 'viewer';
export type ProductType = 'kibble' | 'wet_food' | 'pouch' | 'treat' | 'other';
export type MedicationEventStatus = 'given' | 'skipped' | 'pending';

export interface Pet {
    id: string;
    household_id: string;
    name: string;
    species: Species;
    breed?: string;
    birth_date?: string;
    sex: Sex;
    neutered: boolean;
    target_weight_kg?: number;
    photo_url?: string;
    notes?: string;
    archived_at?: string;
    created_at: string;
    updated_at: string;
}

// Lightweight version used in lists/selectors (partial DB select)
export type PetSummary = Pick<Pet, 'id' | 'name' | 'species' | 'photo_url' | 'household_id'>;

export interface Product {
    id: string;
    barcode?: string;
    name: string;
    brand?: string;
    product_type: ProductType;
    net_weight_g?: number;
    grams_per_unit?: number;
    kcal_per_100g?: number;
    photo_url?: string;
    verified: boolean;
    created_by?: string;
    deleted_at?: string;
    created_at: string;
    updated_at: string;
}

export interface Profile {
    id: string;
    email?: string;
    full_name?: string;
    avatar_url?: string;
}

export interface FeedLog {
    id: string;
    pet_id: string;
    product_id?: string;
    quantity_grams?: number;
    quantity_units?: number;
    given_by?: string;
    given_at: string;
    notes?: string;
    created_at: string;
    updated_at: string;
    // Joined relations
    product?: Product;
    given_by_profile?: Profile;
    pet?: Pick<Pet, 'id' | 'name' | 'species' | 'photo_url'>;
}
