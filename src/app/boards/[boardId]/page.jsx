"use client"
import { useParams, useRouter } from "next/navigation"
import { userAuthStore } from "@/store/Auth";
import { Account, ID, Query } from "appwrite";
import { account, databases } from "@/lib/client/config";
import { boardsId, columnsId, db , cardsId} from "@/models/name";
import Column from "@/components/ui/column";
import { useState, useEffect } from "react";
import {toast} from "../../../components/ui/sonner"
import {Dialog,DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger} from '../../../components/ui/dialog'
  import axios from "axios";
  

export default function Boardpage(){
    const[isCreateColumnopen, setisCreateColumnopen] = useState(false);
    const [columns, setcolumns] = useState([]);
    const [boarddata,setboardata] = useState(null);
    const [cardscoll,setcardsdata] = useState([]);
    const router = useRouter();
    const params = useParams();
    const jwt = userAuthStore((state) => state.jwt);
    const user = userAuthStore((state) => state.user);
    const hydrated = userAuthStore((state) => state.hydrated);
    const authChecked = userAuthStore((state) => state.authChecked);
    const boardId = params.boardId;
    const [error, seterror] = useState(null);
    const checksession = userAuthStore((state) => state.checkSession);

    const handlerenameColumn = async(e) => {
        try {
            e.preventDefault();

            const formdata = new FormData(e.currentTarget);
            const newColumntitle = formdata.get("newtitle");

            if(typeof newColumntitle !== "string" || newColumntitle.trim().length < 5){
                return;
            }

            const newtitle = newColumntitle.trim();
            
            await databases.updateDocument(
                db,
                columnsId,
                columnId,
                {
                    title: newtitle
                }
            );
            
            setcolumns((prevcolumns) => prevcolumns.map((column) => column.$id === columnId ? {...column, title: newtitle}: column))
            
            setisRenameOpen(false);
        } catch (error) {
            console.error("could not rename Column", error);
        }
    }

    const handlesubmit = async(e) => {
        try {
            e.preventDefault();
            seterror(null);

            let token = jwt;
            if(!token){
                const result = await account.createJWT();
                token = result.jwt
                userAuthStore.setState({jwt: token})
            }

            const formData = new FormData(e.currentTarget);
            
            const ColumnTitle = formData.get("title")

            if (typeof ColumnTitle !== "string" || ColumnTitle.trim().length < 5
            ) {
                seterror("Column title must contain at least 5 characters.");
                return;
            }

            const title = ColumnTitle.trim();

            const response = await axios.post("/api/columns", {
                boardId,
                title
            },{
                headers: {
                    Authorization: `Bearer ${jwt}`
                },
            }
        );

            setcolumns((prev)=> [...prev,response.data]);
            setisCreateColumnopen(false)
        } catch (error) {
            console.error("Could not create Column:", error)

            if(axios.isAxiosError(error)) {
                seterror(
                    error.response?.data?.error ?? "unable to create column. Please try again"
                )
            }else{
                seterror("Something went wrong. Please try again.");
            }
        }
    }

    async function onDeleteColumn(columnId){
        try {
            const cardsinColumns = cardscoll.filter(
                (card) => card.columnId === columnId
            )

            if(cardsinColumns.length > 0){
                toast.error("Move or delete all cards before deleting this column")
                return;
            } 

            await databases.deleteDocument(
                db,
                columnsId,
                columnId
            );

            setcolumns((prevcolumns) => prevcolumns.filter((column) => column.$id !== columnId));
        } catch (error) {
            console.error("Could not delete column: ", error)
        }
    }

    useEffect(() => {
        if (!hydrated) return;
        
        void checksession();
    }, [hydrated, checksession]);
   
    useEffect(() => {
        const fetchBoarddata = async () => {
            if(!hydrated || !authChecked){
                return;
            }

            if (!user) {
                router.push("/login");
                return;
            }

            if (!boardId) {
                router.push(`/boards`);
                return;
            }

            try {
                const board = await databases.getDocument(db, boardsId, boardId);
                
                if (!board) {
                    return;
                }
                
                setboardata(board);
                
                const columnsdata = await databases.listDocuments(
                   db,
                   columnsId,
                   [
                    Query.equal("boardId",boardId),
                    Query.orderAsc("order")
                   ]
                );

                setcolumns(columnsdata.documents);
                
                
                const result = await databases.listDocuments(db, cardsId, [
                   Query.equal("boardId", boardId),
                ]);
    
                setcardsdata(result.documents);
            } catch (error) {
                console.error("Could not fetch board data:", error);
            }
        }
        fetchBoarddata();
    },[hydrated, authChecked, user, boardId, router]);

    if (!hydrated || !authChecked || !user) {
        return null;
    }

    return (
      <div className="min-h-screen bg-zinc-950 p-4 text-zinc-950 sm:p-6 lg:p-8">
        <header className="flex flex-col gap-4 rounded-2xl border border-zinc-800 bg-zinc-900 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6"></header>
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            Your Workspace
          </p>

          <h1 className="text-2xl font-bold tracking-tight text-zinc-100 sm:text-3xl">
            Board Detail Page
          </h1>

          <p className="mt-2 text-sm text-zinc-400">
            organize your tasks and keep your work moving
          </p>
        </div>
        <div>
          <Dialog
            open={isCreateColumnopen}
            onOpenChange={setisCreateColumnopen}
          >
            <DialogTrigger className="shrink-0 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 focus-visible:outline-none">
              + Add Column
            </DialogTrigger>

            <DialogContent className={"sm:max-w-md"}>
              <DialogHeader>
                <DialogTitle className={"text-xl font-semibold"}>
                  Create Column
                </DialogTitle>
              </DialogHeader>

              <form onSubmit={handlesubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="title" className="block text-sm font-medium">
                    Column title
                  </label>
                  <input
                    className="border-input bg-background text-foreground placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-lg border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:outline-none"
                    id="title"
                    name="title"
                    placeholder="Title"
                    type="text"
                    required
                    minLength={5}
                  ></input>
                </div>

                {error && (
                    <p role="alert" className="text-sm text-red-400">
                        {error}
                    </p>
                )}

                <DialogFooter className={"gap-2"}>
                  <button
                    type="button"
                    className="border-input hover:bg-accent rounded-lg border px-4 py-2 text-sm font-medium transition-colors"
                    onClick={() => setisCreateColumnopen(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-indigo-700"
                  >
                    Create Column
                  </button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
        <div className="grid grid-cols-3 gap-4">
          {columns.map((column) => (
            <Column
              key={column.$id}
              columnId={column.$id}
              title={column.title}
              cards={cardscoll.filter((card) => card.columnId === column.$id)}
              boardId={boardId}
              setCardsData={setcardsdata}
              onrename={handlerenameColumn}
              onDelete={onDeleteColumn}
            />
          ))}
        </div>
      </div>
    );
}
