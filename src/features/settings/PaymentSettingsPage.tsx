
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { settingsApi } from "@/api/settings.api"
import { useForm } from "react-hook-form"
import { LoadingState } from "@/components/feedback/LoadingState"
import { FormSection } from "@/components/forms/FormSection"
import { useEffect } from "react"
import toast from "react-hot-toast"
export default function PaymentSettingsPage() {
  const qc = useQueryClient()
  const { data, isLoading } = useQuery({ queryKey: ["payment-settings"], queryFn: () => settingsApi.getPayment() })
  const { register, handleSubmit, reset } = useForm()
  useEffect(() => { if (data) reset(data) }, [data, reset])
  const mutation = useMutation({
    mutationFn: (d: Record<string, unknown>) => settingsApi.updatePayment(d as Parameters<typeof settingsApi.updatePayment>[0]),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["payment-settings"] }); toast.success("Configurações salvas") },
  })
  if (isLoading) return <LoadingState />
  return (
    <div className="max-w-2xl">
      <div className="card p-6">
        <form onSubmit={handleSubmit((d) => mutation.mutate(d))}>
          <FormSection title="PIX e instruções">
            <div><label className="label">Chave PIX</label><input {...register("pix_key")} className="input" placeholder="CPF, CNPJ, e-mail ou chave aleatória" /></div>
            <div><label className="label">Instruções de pagamento manual</label><textarea {...register("manual_payment_instructions")} className="input" rows={3} /></div>
          </FormSection>
          <FormSection title="Depósito">
            {[
              { name: "require_deposit_by_default", label: "Exigir depósito por padrão" },
              { name: "require_deposit_for_first_appointment", label: "Exigir para primeiro agendamento" },
              { name: "require_deposit_after_no_show", label: "Exigir após não comparecimento" },
            ].map(({ name, label }) => (
              <label key={name} className="flex items-center gap-2 cursor-pointer">
                <input {...register(name)} type="checkbox" className="rounded" />
                <span className="text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </FormSection>
          <div className="flex justify-end"><button type="submit" disabled={mutation.isPending} className="btn btn-primary btn-md">{mutation.isPending ? "Salvando..." : "Salvar"}</button></div>
        </form>
      </div>
    </div>
  )
}
