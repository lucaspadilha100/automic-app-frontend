
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "@/api/settings.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"
export default function BookingSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["settings"], queryFn: () => settingsApi.get() })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data?.booking_policy) reset(data.booking_policy) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updateBookingPolicy(d),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["settings"] }); toast.success("Política salva") },
  })
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="Política de agendamento">
            <div className="grid grid-cols-2 gap-4">
              <div><label className="label">Antecedência mínima (min)</label><input {...register("min_minutes_before_booking", { valueAsNumber: true })} type="number" className="input" /></div>
              <div><label className="label">Máx. dias à frente</label><input {...register("max_days_ahead_booking", { valueAsNumber: true })} type="number" className="input" /></div>
              <div><label className="label">Intervalo entre slots (min)</label><input {...register("slot_interval_minutes", { valueAsNumber: true })} type="number" className="input" /></div>
              <div><label className="label">Mín. horas para cancelar</label><input {...register("min_hours_before_cancel", { valueAsNumber: true })} type="number" className="input" /></div>
            </div>
          </FormSection>
          <div className="flex justify-end"><button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">{mutation.isPending ? "Salvando..." : "Salvar"}</button></div>
        </form>
      </div>
    </div>
  )
}
