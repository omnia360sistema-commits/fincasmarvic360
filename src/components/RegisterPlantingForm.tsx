import { useState, useMemo } from 'react';
import { useInsertPlanting } from '@/hooks/useParcelData';
import { toast } from '@/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';


const CROP_CYCLES: Record<string, number> = {
 broccoli: 90,
 romanesco: 95,
 cabbage: 120,
 lettuce: 60,
 celery: 110,
};


export default function RegisterPlantingForm({
 parcelId,
 onClose,
}: {
 parcelId: string;
 onClose: () => void;
}) {
 const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
 const [crop, setCrop] = useState('broccoli');
 const [notes, setNotes] = useState('');


 const mutation = useInsertPlanting();


 const harvestDate = useMemo(() => {
   const cycle = CROP_CYCLES[crop] || 90;
   const d = new Date(date);
   d.setDate(d.getDate() + cycle);
   return d.toISOString().slice(0, 10);
 }, [date, crop]);


 const handleSubmit = (e: React.FormEvent) => {
   e.preventDefault();


   mutation.mutate(
     {
       parcel_id: parcelId,
       date,
       crop,
       notes: notes || null,
     },
     {
       onSuccess: () => {
         toast({
           title: 'Plantación registrada',
           description: 'El registro se guardó correctamente.',
         });
         onClose();
       },
       onError: (err: any) => {
         toast({
           title: 'Error',
           description: err.message,
           variant: 'destructive',
         });
       },
     }
   );
 };


 return (
   <div className="px-5 pb-6">
     <button
       onClick={onClose}
       className="flex items-center gap-2 text-sm text-muted-foreground mb-4"
     >
       <ArrowLeft className="w-4 h-4" /> Volver
     </button>


     <h3 className="text-lg font-bold text-foreground mb-4">
       Registrar Plantación
     </h3>


     <form onSubmit={handleSubmit} className="space-y-4">


       <div>
         <label className="text-xs text-muted-foreground mb-1 block">
           Fecha plantación
         </label>
         <Input
           type="date"
           value={date}
           onChange={(e) => setDate(e.target.value)}
           required
         />
       </div>


       <div>
         <label className="text-xs text-muted-foreground mb-1 block">
           Cultivo
         </label>


         <select
           value={crop}
           onChange={(e) => setCrop(e.target.value)}
           className="w-full h-10 rounded-xl border bg-background px-3 text-sm"
         >
           <option value="broccoli">Brócoli</option>
           <option value="romanesco">Romanesco</option>
           <option value="cabbage">Col</option>
           <option value="lettuce">Lechuga</option>
           <option value="celery">Apio</option>
         </select>
       </div>


       <div>
         <label className="text-xs text-muted-foreground mb-1 block">
           Cosecha estimada
         </label>


         <Input value={harvestDate} readOnly />
       </div>


       <div>
         <label className="text-xs text-muted-foreground mb-1 block">
           Notas
         </label>
         <Textarea
           value={notes}
           onChange={(e) => setNotes(e.target.value)}
           placeholder="Observaciones..."
           rows={3}
         />
       </div>


       <Button
         type="submit"
         className="w-full h-12 rounded-2xl text-base font-bold"
         disabled={mutation.isPending}
       >
         {mutation.isPending ? 'Guardando...' : 'Guardar Plantación'}
       </Button>


     </form>
   </div>
 );
}



