import { getCharities } from "@/actions/charity";
import { getAccounts } from "@/actions/accounts";
import { formatCurrency } from "@/utils/currency";
import { Plus, Heart, Calendar } from "lucide-react";
import { CharityForm } from "@/components/charity/CharityForm";

export default async function CharityPage() {
  const [charities, accounts] = await Promise.all([
    getCharities(),
    getAccounts()
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Recurring Sadqa / Charity</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage automatic reminders and recurring donations.</p>
        </div>
        <CharityForm accounts={accounts} />
      </div>

      {charities.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground border border-white/10 rounded-2xl bg-card flex flex-col items-center justify-center">
          <Heart className="w-12 h-12 text-rose-500/20 mb-4" />
          <p>No recurring charity records found.</p>
          <p className="text-sm mt-1">Set up automated reminders for your regular Sadqa.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {charities.map((item: any) => (
            <div key={item.id} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-rose-500/10 text-rose-500 rounded-lg">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{formatCurrency(item.amount)}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                       {item.note || 'No description'}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-xs font-medium px-2 py-1 rounded-md bg-white/5 capitalize text-muted-foreground">
                    {item.frequency}
                  </span>
                  {item.account && (
                    <span className="text-[10px] text-muted-foreground">
                      via {item.account.name}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="mt-4 pt-4 border-t border-white/5 flex justify-between items-center text-sm text-muted-foreground">
                 <div className="flex items-center gap-1.5">
                   <Calendar className="w-4 h-4" />
                   <span>Next: {new Date(item.next_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                 </div>
                 <div className="flex gap-2">
                   {item.auto_reminder && <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-full">Reminder</span>}
                   {item.auto_generate_transaction && <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 rounded-full">Auto-Pay</span>}
                 </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
