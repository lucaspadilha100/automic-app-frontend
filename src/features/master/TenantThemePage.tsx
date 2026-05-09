
import { useParams } from "react-router-dom"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { masterApi } from "@/api/master.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { PageHeader } from "@/components/ui/PageHeader"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"

const TEMPLATES = [
  {
    id: "classic",
    label: "Classic",
    description: "Layout claro, minimalista e familiar. Ideal para clínicas e profissionais que preferem um visual limpo.",
    preview: "bg-white border-slate-200",
    accent: "#6366f1",
  },
  {
    id: "premium",
    label: "Premium",
    description: "Design escuro, elegante e sofisticado. Ideal para salões, estéticas e marcas com identidade forte.",
    preview: "bg-neutral-900 border-neutral-700",
    accent: "#c9a96e",
  },
]

export default function TenantThemePage() {
  const { tenantId } = useParams<{ tenantId: string }>()
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["master", "tenant-theme", tenantId], queryFn: () => masterApi.getTenantTheme(tenantId!) })
  const { register, handleSubmit, reset, watch, setValue } = useForm()
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const currentPreset = watch("theme_preset") || "classic"
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
          <FormSection title="Template da Página Pública">
            <input type="hidden" {...register("theme_preset")} />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {TEMPLATES.map(tpl => (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => setValue("theme_preset", tpl.id, { shouldDirty: true })}
                  className={`relative flex flex-col gap-3 p-4 rounded-xl border-2 text-left transition-all ${currentPreset === tpl.id ? "border-indigo-500 shadow-sm" : "border-slate-200 hover:border-slate-300"}`}
                >
                  {currentPreset === tpl.id && (
                    <span className="absolute top-2 right-2 text-[10px] font-bold text-white bg-indigo-500 rounded-full px-2 py-0.5">Ativo</span>
                  )}
                  <div className={`h-20 rounded-lg border ${tpl.preview} flex items-end p-2 gap-1`}>
                    <div className="h-3 rounded" style={{ width: "60%", backgroundColor: tpl.accent, opacity: 0.9 }} />
                    <div className="h-2 rounded bg-slate-300/40" style={{ width: "30%" }} />
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">{tpl.label}</p>
                    <p className="text-xs text-slate-500 mt-0.5 leading-snug">{tpl.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </FormSection>
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
