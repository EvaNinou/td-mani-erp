export async function getCustomers(supabase) {
  const { data, error } = await supabase
    .from('customers')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function createCustomer(supabase, customer) {
  const { error } = await supabase
    .from('customers')
    .insert([customer]);

  if (error) throw error;
}

export async function updateCustomer(supabase, customerId, customer) {
  const { error } = await supabase
    .from('customers')
    .update(customer)
    .eq('id', customerId);

  if (error) throw error;
}

export async function softDeleteCustomer(supabase, customerId) {
  const { error } = await supabase
    .from('customers')
    .update({ is_deleted: true })
    .eq('id', customerId);

  if (error) throw error;
}

export async function restoreCustomer(supabase, customerId) {
  const { error } = await supabase
    .from('customers')
    .update({ is_deleted: false })
    .eq('id', customerId);

  if (error) throw error;
}
