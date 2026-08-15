import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useState,
} from "react";
import {
  createClient,
  processLock,
  SupabaseClient,
} from "@supabase/supabase-js";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSession } from "@clerk/clerk-expo";
import { Database } from "@/types/database";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

type SupabaseContextType = {
  supabase: SupabaseClient<Database>;
};

const SupabaseContext = createContext<SupabaseContextType>({
  supabase: createClient<Database>(supabaseUrl, supabaseAnonKey),
});
export default function SupabaseProvider({ children }: PropsWithChildren) {
  const { session } = useSession();
  const [supabase, setSupabase] = useState<SupabaseClient<Database>>(
    createClient<Database>(supabaseUrl, supabaseAnonKey),
  );
  useEffect(() => {
    const newClient = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
        lock: processLock,
      },
      async accessToken() {
        return session?.getToken() ?? null;
      },
    });
    setSupabase(newClient);

    if (session?.user) {
      const user = session.user;
      const profile = {
        id: user.id,
        first_name: user.firstName ?? "",
        last_name: user.lastName ?? "",
        full_name:
          user.fullName ?? `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
        avatar_url: user.imageUrl ?? null,
      };
      newClient
        .from("profiles")
        .upsert(profile, { onConflict: "id" })
        .then(({ error }) => {
          if (error) {
            console.error("Profile sync failed:", error.message);
          }
        });
    }
  }, [session]);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
}

export const useSupabase = () => {
  const { supabase } = useContext(SupabaseContext);

  return supabase;
};
