import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import { AppwriteException, ID, Models } from "appwrite";
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
                } catch (error) {
                    console.error(error);
                    return {
                        success:false,
                        error: error instanceof AppwriteException ? error : new Error("Something went wrong while logging out user")
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
