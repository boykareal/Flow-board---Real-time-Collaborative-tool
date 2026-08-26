"use client"
import { useParams, useRouter } from "next/navigation"
import { userAuthStore } from "@/store/Auth";
import { Query } from "appwrite";
import { databases } from "@/lib/client/config";
import { boardsId, columnsId, db , cardsId} from "@/models/name";
import Column from "@/components/ui/column";
import { useState, useEffect } from "react";

export default function Boardpage(){
    const [columns, setcolumns] = useState([]);
    const [boarddata,setboardata] = useState(null);
    const [cardscoll,setcardsdata] = useState([]);
    const router = useRouter();
    const params = useParams();
    
    const { user, hydrated } = userAuthStore((state) => ({
        user: state.user,
        hydrated: state.hydrated,
    }));
    const boardId = params.boardId;
   

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

            const board = await databases.getDocument(db, boardsId, boardId);
            
            if (!board) {
                return;
            }
            
            setboardata(board);
            
            const columnsdata = await databases.listDocuments(
               db,
               columnsId,
               [
                Query.equal("boardId",boardId)
               ]
            );
            
            setcolumns(columnsdata.documents);
            
            
            const result = await databases.listDocuments(db, cardsId, [
               Query.equal("boardId", boardId),
            ]);

            setcardsdata(result.documents);
        }

        fetchBoarddata();
    },[hydrated, user, boardId, router]);

    const addcardbuttonfunc = (columnid) => {
        
    }

    return(
        <div>
            Board Detail Page
            <div className="grid grid-cols-3 gap-4">
                {columns.map((column) => (
                    <Column key={column.$id}
                    columnId={column.$id}
                    title={column.title}
                    cards={cardscoll.filter((card) => card.columnId === column.$id)}
                     />
                )) }
            </div>
        </div>
    )
}