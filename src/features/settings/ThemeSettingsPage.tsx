import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "@/api/settings.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"

const COLOR_FIELDS = [
  { name: "primary_color", label: "Cor primária" },
  { name: "secondary_color", label: "Cor secundária" },
  { name: "background_color", label: "Fundo" },
  { name: "button_color", label: "Botões" },
  { name: "text_color", label: "Texto" },
] as const

type ThemeForm = Record<string, string>

export default function ThemeSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => settingsApi.get() })

  const { register, handleSubmit, reset, watch, setValue } = useForm<ThemeForm>()

  useEffect(() => {
    if (data?.theme) reset(data.theme)
  }, [data, reset])

  const mutation = useMutation({
    mutationFn: (d: ThemeForm) => settingsApi.updateTheme(d as Parameters<typeof settingsApi.updateTheme>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Tema salvo! Já reflete na vitrine.") },
    onError: () => toast.error("Erro ao salvar tema"),
  })

  const formValues = watch()
  const primaryColor = formValues["primary_color"] || "#6366f1"

  if (isLoading) return <LoadingState />

  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Cores">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {COLOR_FIELDS.map(({ name, label }) => {
                const current = formValues[name] || "#000000"
                return (
                  <div key={name} className="space-y-1">
                    <label className="label mb-0">{label}</label>
                    <div className="flex items-center gap-2">
                      {/* color picker usa onChange + setValue — NÃO usa register para evitar o bug do double-register */}
                      <input
                        type="color"
                        value={current}
                        onChange={e => setValue(name, e.target.value, { shouldDirty: true })}
                        className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      {/* text input usa register normalmente */}
                      <input
                        {...register(name)}
                        className="input text-xs py-1.5 flex-1"
                        placeholder="#000000"
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          </FormSection>

          <FormSection title="Imagens">
            <div className="space-y-3">
              <div>
                <label className="label">URL do logotipo</label>
                <input {...register("logo_url")} className="input" placeholder="https://..." />
                {formValues["logo_url"] && (
                  <img src={formValues["logo_url"]} className="mt-2 w-14 h-14 rounded-xl object-cover border border-slate-200"
                    alt="Logo" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
              <div>
                <label className="label">URL da imagem de capa (fundo da vitrine)</label>
                <input {...register("cover_image_url")} className="input" placeholder="https://images.unsplash.com/..." />
                {formValues["cover_image_url"] && (
                  <img src={formValues["cover_image_url"]} className="mt-2 w-full h-24 rounded-xl object-cover border border-slate-200"
                    alt="Capa" onError={e => (e.currentTarget.style.display = 'none')} />
                )}
              </div>
            </div>
          </FormSection>

          {/* Preview ao vivo */}
          <div className="mb-6 p-4 rounded-xl border-2 border-dashed border-gray-200">
            <p className="text-xs text-gray-400 mb-3">Pré-visualização do botão principal</p>
            <div className="flex items-center gap-3">
              <button type="button" className="px-5 py-2.5 rounded-xl text-white text-sm font-bold"
                style={{ backgroundColor: primaryColor }}>
                Agendar agora
              </button>
              <span className="text-xs text-slate-400">{primaryColor}</span>
            </div>
          </div>

          <div className="flex justify-end">
            <button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">
              {mutation.isPending ? "Salvando..." : "Salvar tema"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
