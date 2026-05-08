
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { masterApi } from "@/api/master.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { PageHeader } from "@/components/ui/PageHeader"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"
export default function TenantSettingsPage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["master", "tenant-settings", tenantId], queryFn: () => masterApi.getTenantSettings(tenantId!) })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => masterApi.updateTenantSettings(tenantId!, d as Parameters<typeof masterApi.updateTenantSettings>[1]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master", "tenant-settings", tenantId] }); toast.success("Configurações salvas") },
  })
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <PageHeader title="Configurações do tenant" />
      <div className="card bg-white border-slate-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Página pública">
            <div><label className="label text-slate-600">Título</label><input {...register("homepage_title")} className="input bg-white border-slate-200 text-slate-900" /></div>
            <div><label className="label text-slate-600">Subtítulo</label><input {...register("homepage_subtitle")} className="input bg-white border-slate-200 text-slate-900" /></div>
          </FormSection>
          <FormSection title="Permissões">
            {[["show_prices","Mostrar preços"],["allow_professional_choice","Escolha de profissional"],["allow_multiple_services","Múltiplos serviços"],["allow_customer_cancel","Cliente pode cancelar"]].map(([name, label]) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer"><input {...register(name)} type="checkbox" className="rounded" /><span className="text-sm text-slate-600">{label}</span></label>
            ))}
          </FormSection>
          <div className="flex justify-end"><button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">{mutation.isPending ? "Salvando..." : "Salvar"}</button></div>
        </form>
      </div>
    </div>
  )
}
