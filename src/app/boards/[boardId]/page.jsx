"use client"
import { useParams, useRouter } from "next/navigation"
import { userAuthStore } from "@/store/Auth";
import { ID, Query } from "appwrite";
import { databases } from "@/lib/client/config";
import { boardsId, columnsId, db , cardsId} from "@/models/name";
import Column from "@/components/ui/column";
import { useState, useEffect } from "react";
import {Dialog,DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger} from '../../../components/ui/dialog'

export default function Boardpage(){
    const [columns, setcolumns] = useState([]);
    const [boarddata,setboardata] = useState(null);
    const [cardscoll,setcardsdata] = useState([]);
    const router = useRouter();
    const params = useParams();
    
   const user = userAuthStore((state) => state.user);
   const hydrated = userAuthStore((state) => state.hydrated);
    const boardId = params.boardId;

    const handlerenameColumn = async(e) => {
        try {
            e.preventDefault();

            const formdata = new FormData(e.currentTarget);
            const newColumntitle = formdata.get("newtitle");

            if(typeof newColumntitle !== "string" || newColumntitle.trim.length() < 3){
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

            const formData = new FormData(e.currentTarget);

            const ColumnTitle = formData.get("title")

            const cols = await databases.createDocument(
              db,
              columnsId,
              ID.unique(),
              {
                title: ColumnTitle,
                boardId: boardId,
                order: columns.length,
              },
            );

            setcolumns((prev)=> [...prev,cols]);
        } catch (error) {
            console.error("Could not create Column:", error)
        }
    }
   
    useEffect(() => {
        const fetchBoarddata = async () => {
            if(!hydrated){
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
    },[hydrated, user, boardId, router]);
    return (
      <div>
        Board Detail Page
        <div>
          <Dialog>
            <DialogTrigger>Add column</DialogTrigger>

            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Column</DialogTitle>
              </DialogHeader>

              <form onSubmit={handlesubmit}>
                <div>
                  <label htmlFor="title">title</label>
                  <input
                    className="text-black"
                    id="title"
                    name="title"
                    placeholder="Title"
                    type="text"
                    required
                  ></input>
                </div>

                <DialogFooter>
                  <button type="submit">Create Column</button>
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
            />
          ))}
        </div>
      </div>
    );
}