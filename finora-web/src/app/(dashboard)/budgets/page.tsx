import { getBudgets } from "@/actions/budgets";
import { getAccounts } from "@/actions/accounts";
import { getCategories } from "@/actions/categories";
import { formatCurrency } from "@/utils/currency";
import { Plus } from "lucide-react";
import { BudgetForm } from "@/components/budgets/BudgetForm";
import { BudgetCard } from "@/components/budgets/BudgetCard";

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
            <BudgetCard 
              key={budget.id} 
              budget={budget} 
              accounts={accounts} 
              categories={categories.filter(c => c.type === 'expense')} 
            />
          ))}
        </div>
      )}
    </div>
  );
}
