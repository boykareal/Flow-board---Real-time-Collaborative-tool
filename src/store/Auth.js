import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { persist } from "zustand/middleware";

import { AppwriteException, ID, Models } from "appwrite";
import { account } from "@/lib/client/config";

export const userAuthStore = create()(
    persist(
        immer((set) => ({
            session: null,
            jwt: null,
            user: null,
            hydrated: false,

            setHydrated(){
                set({hydrated: true})
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

                    set({session, user, jwt})

                    return {success: true}
                } catch (error) {
                    return{
                        success: false,
                        error: error instanceof AppwriteException ? error: error
                    }
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
                    return {
                        success: false,
                        error: error instanceof AppwriteException ? error: null
                    }
                }
            },

            
        }))
    )
)