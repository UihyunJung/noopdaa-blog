import { createServerClient } from "@/lib/supabase/server";
import type { Category } from "@/lib/types";
import { CategoriesClient } from "./CategoriesClient";

export default async function CategoriesPage() {
  const supabase = await createServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name") as { data: Category[] | null };

  return <CategoriesClient initialCategories={data || []} />;
}
