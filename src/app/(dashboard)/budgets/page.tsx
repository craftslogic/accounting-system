import { getBudgets } from "@/actions/budgets";
import { getAccounts } from "@/actions/accounts";
import { getCategories } from "@/actions/categories";
import { formatCurrency } from "@/utils/currency";
import { Plus } from "lucide-react";
import { BudgetForm } from "@/components/budgets/BudgetForm";

export default async function BudgetsPage() {
  const [budgets, accounts, categories] = await Promise.all([
    getBudgets(),
    getAccounts(),
    getCategories()
  ]);

  return (
    <div className="p-4 md:p-6 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Budgets & Limits</h1>
          <p className="text-muted-foreground text-sm mt-1">Manage your spending limits and track your goals.</p>
        </div>
        <BudgetForm accounts={accounts} categories={categories.filter(c => c.type === 'expense')} />
      </div>

      {budgets.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground border rounded-2xl border-white/10 bg-card">
          <p>No budgets setup yet. Create one to start tracking your limits.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((budget: any) => (
            <div key={budget.id} className="rounded-2xl border border-white/10 bg-card p-5">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/5 rounded-lg text-xl">
                    {budget.category?.icon || '🎯'}
                  </div>
                  <div>
                    <h3 className="font-semibold">{budget.category?.name || 'All Categories'}</h3>
                    <p className="text-xs text-muted-foreground capitalize">{budget.period} Budget</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(budget.amount)}</p>
                  <p className="text-xs text-muted-foreground">Limit</p>
                </div>
              </div>
              
              <div className="space-y-2 mt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Spent</span>
                  <span className="font-medium">$0.00 (0%)</span>
                </div>
                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 w-[0%]" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
