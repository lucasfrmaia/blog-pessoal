'use client';

import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { IPost, IPostCreate } from '@/app/api/_services/entities/Post';
import { ICategory } from '@/app/api/_services/entities/category';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

import {
   Form,
   FormField,
   FormItem,
   FormLabel,
   FormControl,
   FormMessage,
} from '@/app/_components/ui/form';
import { Input } from '@/app/_components/ui/input';
import { Textarea } from '@/app/_components/ui/textarea';
import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
} from '@/app/_components/ui/select';
import { Button } from '@/app/_components/ui/button';
import { Check, X } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs';
import PostPreview from '../preview/PostPreview';

const formSchema = z.object({
   title: z.string().min(1, 'O título é obrigatório'),
   description: z.string().min(1, 'A descrição é obrigatória'),
   content: z.string().min(1, 'O conteúdo é obrigatório'),
   img: z.string().min(1, 'A imagem de capa é obrigatória'),
   categories: z.array(z.string()).min(1, 'Selecione pelo menos uma categoria'),
});

type FormValues = z.infer<typeof formSchema>;

interface PostFormProps {
   defaultValues?: Partial<IPost>;
   onSubmit: (data: IPostCreate) => Promise<void>;
}

export default function PostForm({ defaultValues, onSubmit }: PostFormProps) {
   const { data: session } = useSession();
   const user = session?.user;
   const { data: categories } = useQuery<ICategory[]>({
      queryKey: ['categories'],
      queryFn: async () => {
         const response = await fetch(`${process.env.API_URL}/categories`);
         if (!response.ok) {
            throw new Error('Erro ao buscar categorias');
         }
         return response.json();
      },
   });

   const handleSubmit = async (data: FormValues) => {
      if (!user?.id) return;

      const postData: IPostCreate = {
         ...data,
         authorId: user.id,
      };

      await onSubmit(postData);
   };

   const form = useForm<FormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
         title: defaultValues?.title ?? '',
         description: defaultValues?.description ?? '',
         content: defaultValues?.content ?? '',
         img: defaultValues?.img ?? '',
         categories: defaultValues?.categories?.map((cat) => cat.id) ?? [],
      },
   });

   const title = form.watch('title');
   const img = form.watch('img');
   const description = form.watch('description');
   const content = form.watch('content');
   const categoriesId = form.watch('categories');
   const currentCategories = useMemo(() => {
      if (!categories) return [];

      return categoriesId
         .map((currentId) => categories.find((c) => currentId === c.id))
         .filter((c): c is ICategory => !!c); // Remove null/undefined
   }, [categories, categoriesId]);

   return (
      <Tabs>
         <TabsList>
            <TabsTrigger value="form">Formulário</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
         </TabsList>

         <TabsContent value="form">
            <Form {...form}>
               <form
                  onSubmit={form.handleSubmit(handleSubmit)}
                  className="p-4 space-y-4"
               >
                  <FormField
                     control={form.control}
                     name="title"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Título</FormLabel>
                           <FormControl>
                              <Input {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="description"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Descrição</FormLabel>
                           <FormControl>
                              <Textarea {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="img"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Imagem de Capa</FormLabel>
                           <FormControl>
                              <Input {...field} />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="categories"
                     render={({ field }) => (
                        <FormItem>
                           <FormLabel>Categorias</FormLabel>
                           <FormControl>
                              <div className="space-y-2">
                                 <Select
                                    onValueChange={(value) => {
                                       if (!field.value.includes(value)) {
                                          field.onChange([
                                             ...field.value,
                                             value,
                                          ]);
                                       }
                                    }}
                                 >
                                    <SelectTrigger>
                                       <SelectValue placeholder="Selecione as categorias" />
                                    </SelectTrigger>
                                    <SelectContent>
                                       {categories?.map((category) => (
                                          <SelectItem
                                             key={category.id}
                                             value={category.id}
                                             disabled={field.value.includes(
                                                category.id,
                                             )}
                                          >
                                             {category.name}
                                          </SelectItem>
                                       ))}
                                    </SelectContent>
                                 </Select>

                                 <div className="flex flex-wrap gap-2">
                                    {field.value.map((categoryId) => {
                                       const category = categories?.find(
                                          (c) => c.id === categoryId,
                                       );
                                       return (
                                          category && (
                                             <div
                                                key={category.id}
                                                className="flex items-center gap-1 bg-secondary text-secondary-foreground px-2 py-1 rounded-md"
                                             >
                                                <span>{category.name}</span>
                                                <Button
                                                   type="button"
                                                   variant="ghost"
                                                   size="icon"
                                                   className="h-4 w-4 p-0"
                                                   onClick={() =>
                                                      field.onChange(
                                                         field.value.filter(
                                                            (id) =>
                                                               id !==
                                                               category.id,
                                                         ),
                                                      )
                                                   }
                                                >
                                                   <X className="h-3 w-3" />
                                                </Button>
                                             </div>
                                          )
                                       );
                                    })}
                                 </div>
                              </div>
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <FormField
                     control={form.control}
                     name="content"
                     render={({ field }) => (
                        <FormItem className="h-[550px]">
                           <FormLabel>Conteúdo</FormLabel>
                           <FormControl>
                              <ReactQuill
                                 theme="snow"
                                 value={field.value}
                                 onChange={field.onChange}
                                 className="h-[450px]"
                                 modules={{
                                    toolbar: [
                                       [{ header: [1, 2, 3, false] }],
                                       [
                                          'bold',
                                          'italic',
                                          'underline',
                                          'strike',
                                       ],
                                       [
                                          { list: 'ordered' },
                                          { list: 'bullet' },
                                       ],
                                       ['link', 'image'],
                                       ['clean'],
                                    ],
                                 }}
                              />
                           </FormControl>
                           <FormMessage />
                        </FormItem>
                     )}
                  />

                  <Button type="submit" className="w-full">
                     {defaultValues ? 'Atualizar' : 'Criar'} Post
                  </Button>
               </form>
            </Form>
         </TabsContent>

         <TabsContent value="preview">
            <PostPreview
               coverImage={img}
               title={title}
               description={description}
               content={content}
               categories={currentCategories}
            />
         </TabsContent>
      </Tabs>
   );
}
