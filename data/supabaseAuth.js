//Supabase URL and KEY for fetch
const SUPABASE_URL = "https://jbreqpobtmxleramzisc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpicmVxcG9idG14bGVyYW16aXNjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQwMTg2ODMsImV4cCI6MjA3OTU5NDY4M30.QUhhLX7auPGPSkKA6DhHDFvd6Vm4bLBAOGmiaLEAK-4";

const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

//Regular Auth
const SupabaseAuth = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email, 
      password
    });

    if (error) throw new Error(error.message);
    return data.user;
  },
//SignUp
  async signup(email, password, name = "") {
    const { data, error } = await supabase.auth.signUp({
      email, password
    });

    if (error) throw new Error(error.message);

    const user = data.user;

    // Create profile row 
    const { error: profileError } = await supabase
      .from("profiles")
      //Inster object, user can set later
      .insert({
        id: user.id,
        name: name || email.split("@")[0],
        favorite_categories: [],
        dietary_preferences: [],
        recently_viewed_product_ids: [],
        recommended_product_ids: []
      });

    if (profileError) throw new Error(profileError.message);

    return user;
  },
  //Use for dynamic data loading
  async getCurrentUser() {
    const { data } = await supabase.auth.getUser();
    return data.user || null;
  },

  async getCurrentUserWithProfile() {
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) return null;

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (error) return { user, profile: null };
    return { user, profile };
  },

  async logout() {
    await supabase.auth.signOut();
  }
};

window.SupabaseAuth = SupabaseAuth;
