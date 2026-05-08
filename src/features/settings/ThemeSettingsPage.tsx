
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "@/api/settings.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"
export default function ThemeSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => settingsApi.get() })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data?.theme) reset(data.theme) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateTheme(d as Parameters<typeof settingsApi.updateTheme>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Tema salvo") },
  })
  const primaryColor = "#6366f1"
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Cores">
            <div className="grid grid-cols-2 gap-4">
              {[
                { name: "primary_color", label: "Cor primária" },
                { name: "secondary_color", label: "Cor secundária" },
                { name: "background_color", label: "Fundo" },
                { name: "button_color", label: "Botões" },
                { name: "text_color", label: "Texto" },
              ].map(({ name, label }) => (
                <div key={name} className="flex items-center gap-2">
                  <input {...register(name)} type="color" className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-1" />
                  <div><label className="label mb-0">{label}</label><input {...register(name)} className="input text-xs py-1.5" placeholder="#000000" /></div>
                </div>
              ))}
            </div>
          </FormSection>
          <FormSection title="Imagens">
            <div><label className="label">URL do logotipo</label><input {...register("logo_url")} className="input" placeholder="https://..." /></div>
            <div><label className="label">URL da imagem de capa</label><input {...register("cover_image_url")} className="input" placeholder="https://..." /></div>
          </FormSection>
          <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Pré-visualização do botão</p>
            <button type="button" className="btn btn-md rounded-xl" style={{ backgroundColor: primaryColor, color: "white" }}>Agendar agora</button>
          </div>
          <div className="flex justify-end"><button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">{mutation.isPending ? "Salvando..." : "Salvar tema"}</button></div>
        </form>
      </div>
    </div>
  )
}
