"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Ban, Edit2, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import QueryError from "../errors/QueryError";
import { useToast } from "../ui/use-toast";
import { IPost } from "@/app/api/_services/modules/post/entities/Post";
import { Column, DataTable } from "../shared/DataTable";
import { Button } from "../ui/button";
import { PostDialog } from "./dialogs/PostDialog";
import { Badge } from "../ui/badge";
import {
   AlertDialog,
   AlertDialogAction,
   AlertDialogCancel,
   AlertDialogContent,
   AlertDialogDescription,
   AlertDialogFooter,
   AlertDialogHeader,
   AlertDialogTitle,
   AlertDialogTrigger,
} from "../ui/alert-dialog";
import { ITENS_PER_PAGE_TABLE } from "@/utils/constantes/constants";
import { CategoryBadge } from "../category/CategoryBadge";
import { LoadingDataTable } from "../loadings/PostListLoading";

interface IPostList {
   currentPage: number;
   setCurrentPage: (number: number) => void;
}

export function PostList({ currentPage, setCurrentPage }: IPostList) {
   const { toast } = useToast();
   const queryClient = useQueryClient();

   const { data, isLoading, error, refetch } = useQuery({
      queryKey: ["posts", currentPage],
      queryFn: async () => {
         await new Promise((resolve) => setTimeout(resolve, 0.1 * 1000));
         const params = new URLSearchParams({
            page: currentPage.toString(),
            limit: ITENS_PER_PAGE_TABLE.toString(),
         });

         const response = await fetch(`/api/posts/page?${params}`);

         if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || "Erro Desconhecido");
         }

         return response.json();
      },
   });

   const { mutate: deletePost } = useMutation({
      mutationFn: async (id: string) => {
         const response = await fetch(`/api/posts/${id}`, {
            method: "DELETE",
         });

         if (!response.ok) {
            const error = await response.json();
            throw new Error(error?.message || "Erro Desconhecido");
         }
         return response.json();
      },
      onSuccess: () => {
         toast({
            title: "Post excluído com sucesso!",
            description: "O post foi removido do sistema.",
         });
         refetch();
      },
      onError: (error) => {
         toast({
            title: "Erro ao excluir post",
            description:
               "Ocorreu um erro ao tentar excluir o post: " + error.message,
            variant: "destructive",
         });
      },
   });

   const handleDelete = async (id: string) => {
      deletePost(id);
   };

   const handlePageChange = (newPage: number) => {
      setCurrentPage(newPage);
   };

   if (isLoading) return <LoadingDataTable />;

   if (error) return <QueryError onRetry={() => refetch()} />;

   const columns: Column<IPost>[] = [
      {
         header: "ID",
         accessorKey: (post: IPost) => post.id,
      },
      {
         header: "Título",
         accessorKey: (post: IPost) => post.title,
      },
      {
         header: "Categoria",
         accessorKey: (post: IPost) => {
            return (
               <div className="flex flex-wrap w-56 gap-2 text-primary">
                  {post.categories?.length !== 0 ? (
                     post?.categories?.map((category) => {
                        return <CategoryBadge category={category} />;
                     })
                  ) : (
                     <span>Sem Categoria</span>
                  )}
               </div>
            );
         },
      },
      {
         header: "Visualizações",
         accessorKey: (post: IPost) => post.views,
         className: "text-right",
      },
      {
         header: "Data",
         accessorKey: (post: IPost) =>
            format(new Date(post.createdAt), "dd 'de' MMMM 'de' yyyy", {
               locale: ptBR,
            }),
      },
      {
         header: "Ações",
         accessorKey: (post: IPost) => (
            <div className="flex items-center gap-2">
               <PostDialog currentPage={currentPage} mode="edit" post={post}>
                  <Button variant="ghost" size="icon">
                     <Edit2 className="h-4 w-4" />
                  </Button>
               </PostDialog>
               <AlertDialog>
                  <AlertDialogTrigger asChild>
                     <Button variant="ghost" size="icon">
                        <Trash2 className="h-4 w-4 text-destructive" />
                     </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                     <AlertDialogHeader>
                        <AlertDialogTitle>
                           Tem certeza que deseja excluir este post?
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                           Esta ação não pode ser desfeita. Isso excluirá
                           permanentemente o post e removerá os dados do
                           servidor.
                        </AlertDialogDescription>
                     </AlertDialogHeader>
                     <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                           onClick={() => handleDelete(post.id)}
                        >
                           Continuar
                        </AlertDialogAction>
                     </AlertDialogFooter>
                  </AlertDialogContent>
               </AlertDialog>
            </div>
         ),
      },
   ];

   return (
      <div className="space-y-4">
         <DataTable<IPost>
            data={data?.posts || []}
            columns={columns}
            pagination={{
               page: currentPage,
               pageSize: ITENS_PER_PAGE_TABLE,
               total: data?.total || 0,
            }}
            onPageChange={handlePageChange}
         />
      </div>
   );
}
