import { useEffect, useState } from "react";
import { useNostr } from "./useNostr";
import { Board } from "../types";
import { useToast } from "@/hooks/use-toast";

export const useBoards = () => {
  const { boards, loadBoards, createBoard, connect, connectedRelays } = useNostr();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Fetch boards when connection is established
  useEffect(() => {
    if (connectedRelays === 0) {
      connect();
    }
    
    if (connectedRelays > 0 && boards.length === 0 && !loading) {
      setLoading(true);
      loadBoards()
        .then(() => {
          setLoading(false);
          setError(null);
        })
        .catch(err => {
          setLoading(false);
          setError(err.message || "Failed to load boards");
          toast({
            title: "Error",
            description: "Failed to load boards",
            variant: "destructive",
          });
        });
    }
  }, [connectedRelays, boards.length, loadBoards, connect, toast]);

  // Create a new board
  const handleCreateBoard = async (
    shortName: string,
    name: string,
    description: string
  ): Promise<Board> => {
    try {
      const newBoard = await createBoard(shortName, name, description);
      toast({
        title: "Board Created",
        description: `/${shortName}/ has been created successfully`,
      });
      return newBoard;
    } catch (err: any) {
      const errorMsg = err.message || "Failed to create board";
      toast({
        title: "Error",
        description: errorMsg,
        variant: "destructive",
      });
      throw new Error(errorMsg);
    }
  };

  return {
    boards,
    loading,
    error,
    refreshBoards: loadBoards,
    createBoard: handleCreateBoard,
  };
};
