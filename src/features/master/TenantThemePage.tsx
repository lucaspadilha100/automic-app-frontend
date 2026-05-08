
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { masterApi } from "@/api/master.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { PageHeader } from "@/components/ui/PageHeader"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"
export default function TenantThemePage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["master", "tenant-theme", tenantId], queryFn: () => masterApi.getTenantTheme(tenantId!) })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => masterApi.updateTenantTheme(tenantId!, d as Parameters<typeof masterApi.updateTenantTheme>[1]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["master", "tenant-theme", tenantId] }); toast.success("Tema salvo") },
  })
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <PageHeader title="Tema" />
      <div className="card bg-white border-slate-200 p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Cores">
            <div className="grid grid-cols-2 gap-4">
              {[["primary_color","Cor primária"],["secondary_color","Cor secundária"],["background_color","Fundo"],["button_color","Botões"]].map(([name, label]) => (
                <div key={name}><label className="label text-slate-600">{label}</label><input {...register(name)} className="input bg-white border-slate-200 text-slate-900" placeholder="#000000" /></div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Imagens">
            <div><label className="label text-slate-600">URL logotipo</label><input {...register("logo_url")} className="input bg-white border-slate-200 text-slate-900" /></div>
            <div><label className="label text-slate-600">URL imagem de capa</label><input {...register("cover_image_url")} className="input bg-white border-slate-200 text-slate-900" /></div>
          </FormSection>
          <div className="flex justify-end"><button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">{mutation.isPending ? "Salvando..." : "Salvar tema"}</button></div>
        </form>
      </div>
    </div>
  )
}
