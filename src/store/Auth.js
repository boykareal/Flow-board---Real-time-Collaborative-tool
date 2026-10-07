import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import { ID } from "appwrite";
import { account } from "@/lib/client/config";

export const userAuthStore = create()(
    persist(
        immer((set, get) => ({
            session: null,
            jwt: null,
            user: null,
            hydrated: false,
            authChecked: false,
            authChecking: false,

            setHydrated(){
                set({hydrated: true})
            },

            async checkSession(){
                if(get().authChecked || get().authChecking){
                    return;
                }

                set({authChecking: true});

                try {
                    const user = await account.get();
                    const { jwt } = await account.createJWT();
                    set({user,jwt});
                } catch {
                    set({session: null, jwt: null, user: null});
                } finally {
                    set({authChecked: true, authChecking: false});
                }
            },

            async refreshJWT(){
                try {
                    const { jwt } = await account.createJWT();
                    set({jwt});
                    return jwt;
                } catch (error) {
                    if (error.code === 401) {
                        set({session: null, jwt: null, user: null, authChecked: true, authChecking: false});
                    }
                    throw error;
                }
            },

            async createOrUpdateProfile(displayName){
                const jwt = get().jwt || await get().refreshJWT();
                const response = await fetch("/api/profile", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${jwt}`,
                    },
                    body: JSON.stringify({ displayName }),
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error ?? "Unable to save profile");
                }

                return result;
            },

            async login(email, password){
                try {
                    if(email.length === 0 || !email.includes("@") || password.length < 6){
                        return;
                    }
                    const session = await account.createEmailPasswordSession(email,password)
                    const[user, {jwt}] = await Promise.all([
                        account.get(),
                        account.createJWT()
                    ])

                    set({session, user, jwt, authChecked: true, authChecking: false})
                    
                    return {success: true}
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            },

            async createAccount(name, email, password){
                try {
                    if(name.length === 0 || email.length === 0 || password.length === 0 || !email.includes("@")){
                        return new Error("your name or email or password is not valid") 
                    }

                    await account.create(ID.unique(),email, password, name)
                    return {success:true}
                } catch (error) {
                    console.log(error);
                    throw error;
                }
            },

            async logout(){
                try {
                    await account.deleteSession("current")
                    set({session: null, jwt: null, user:null, authChecked: true, authChecking: false})
                    return { success: true };
                } catch (error) {
                    // Expired sessions are already logged out from Appwrite's
                    // perspective; clear the local auth state in that case.
                    if (error?.code === 401 || error?.code === 404) {
                        set({session: null, jwt: null, user:null, authChecked: true, authChecking: false})
                        return { success: true };
                    }
                    return {
                        success:false,
                        error: typeof error?.message === "string" && error.message.trim()
                            ? error.message
                            : "Unable to log out. Please try again."
                    }
                }
            },
        })),
        {
            name: "auth",
            partialize: () => ({}),
            onRehydrateStorage(){
                return(state,error) => {
                    state?.setHydrated()
                }
            }
        }
    )
)
