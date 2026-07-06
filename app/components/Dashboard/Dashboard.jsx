import TDCard from '../shared/TDCard';

export default function Dashboard({
  currentDateTime,
  currentUser,
  dashboardExtraStats,
  dashboardStats,
  riskStats,
  totals,
  businessStats,
  formatGreekLongDate,
  formatGreekTime,
  getGreeting,
  getFirstName,
  formatCurrency,
  formatDate,
  getProjectTitle
}) {
  return (
    <TDCard className="card page-section dashboard-section">
      <div className="dashboard-welcome">
        <div>
          <p className="dashboard-welcome-date">📅 {formatGreekLongDate(currentDateTime)}</p>
          <h2>{getGreeting(currentDateTime)}, {getFirstName(currentUser.name)} 👋</h2>
          <p>Καλώς ήρθες στο TD MANI ERP.</p>
        </div>
        <div className="dashboard-welcome-time">🕒 {formatGreekTime(currentDateTime)}</div>
      </div>

      <div className="dashboard-strip">
        <div className="dashboard-strip-item">👷 <b>{dashboardExtraStats.todayTasks.length}</b><br /><small>Εργασίες σήμερα</small></div>
        <div className="dashboard-strip-item">💰 <b>{dashboardExtraStats.todayPayments.length}</b><br /><small>Εισπράξεις σήμερα</small></div>
        <div className="dashboard-strip-item">🧾 <b>{dashboardExtraStats.todayInvoices.length}</b><br /><small>Τιμολόγια σήμερα</small></div>
        <div className={dashboardStats.overdueTasks > 0 ? 'dashboard-strip-item alert' : 'dashboard-strip-item'}>⚠️ <b>{dashboardStats.overdueTasks}</b><br /><small>Εκκρεμότητες</small></div>
      </div>

      <h3>🚨 Προσοχή</h3>
      <div className="grid">
        <div className={riskStats.riskyProjects.length > 0 ? 'line alert' : 'line'}>
          <p><b>{riskStats.riskyProjects.length}</b></p><small>Έργα με ζημία / αρνητική εικόνα</small>
        </div>
        <div className={dashboardExtraStats.customersWithOpenBalance.length > 0 ? 'line alert' : 'line'}>
          <p><b>{dashboardExtraStats.customersWithOpenBalance.length}</b></p><small>Πελάτες με ανοιχτό υπόλοιπο</small>
        </div>
        <div className={dashboardExtraStats.suppliersWithOpenBalance.length > 0 ? 'line alert' : 'line'}>
          <p><b>{dashboardExtraStats.suppliersWithOpenBalance.length}</b></p><small>Προμηθευτές προς πληρωμή</small>
        </div>
        <div className={dashboardStats.overdueTasks > 0 ? 'line alert' : 'line'}>
          <p><b>{dashboardStats.overdueTasks}</b></p><small>Καθυστερημένες εργασίες</small>
        </div>
      </div>

      <h3>Βασική εικόνα</h3>
      <div className="grid">
        <div className="line"><p><b>{totals.totalProjects}</b></p><small>Συνολικά έργα</small></div>
        <div className="line"><p><b>{dashboardStats.activeProjects}</b></p><small>Ενεργά έργα</small></div>
        <div className="line"><p><b>{dashboardStats.completedProjects}</b></p><small>Ολοκληρωμένα</small></div>
        <div className={totals.totalBalance < 0 ? 'line alert' : 'line'}>
          <p><b>{formatCurrency(totals.totalBalance)}</b></p><small>Εκτιμώμενο κέρδος έργων</small>
        </div>
      </div>

      <h3>Οικονομική εικόνα</h3>
      <div className="grid">
        <div className="line"><p><b>{formatCurrency(totals.totalAgreed)}</b></p><small>Συμφωνημένα έργων</small></div>
        <div className="line"><p><b>{formatCurrency(totals.totalPaid)}</b></p><small>Εισπράξεις</small></div>
        <div className="line"><p><b>{formatCurrency(totals.totalExpenses)}</b></p><small>Έξοδα</small></div>
        <div className={businessStats.currentVat.payableVat > 0 ? 'line alert' : 'line'}>
          <p><b>{formatCurrency(businessStats.currentVat.payableVat)}</b></p><small>Εκτίμηση ΦΠΑ τρέχοντος τριμήνου</small>
        </div>
      </div>

      <h3>Οφειλές / Cashflow</h3>
      <div className="grid">
        <div className="line"><p><b>{formatCurrency(businessStats.customerOpenReceivables)}</b></p><small>Ανοιχτά εισπρακτέα πελατών</small></div>
        <div className={businessStats.supplierOpenPayables > 0 ? 'line alert' : 'line'}>
          <p><b>{formatCurrency(businessStats.supplierOpenPayables)}</b></p><small>Χρωστούμενα σε προμηθευτές</small>
        </div>
        <div className={businessStats.cashView < 0 ? 'line alert' : 'line'}>
          <p><b>{formatCurrency(businessStats.cashView)}</b></p><small>Εικόνα εισπρακτέων - υποχρεώσεων</small>
        </div>
        <div className={dashboardStats.monthlyProfit >= 0 ? 'line' : 'line alert'}>
          <p><b>{formatCurrency(dashboardStats.monthlyProfit)}</b></p><small>Διαφορά μήνα</small>
        </div>
      </div>

      <div className="grid">
        <div className="line">
          <h3>🏆 Top Πελάτες</h3>
          {dashboardExtraStats.topCustomers.length === 0 ? (
            <p>Δεν υπάρχουν πελάτες ακόμα.</p>
          ) : (
            dashboardExtraStats.topCustomers.map(({ customer, totals }, index) => (
              <p key={customer.id}><b>{index + 1}. {customer.name}</b><br /><small>{formatCurrency(totals.agreed)} συμφωνίες • Υπόλοιπο {formatCurrency(totals.customerBalance)}</small></p>
            ))
          )}
        </div>

        <div className="line">
          <h3>🚚 Top Προμηθευτές</h3>
          {dashboardExtraStats.topSuppliers.length === 0 ? (
            <p>Δεν υπάρχουν προμηθευτές ακόμα.</p>
          ) : (
            dashboardExtraStats.topSuppliers.map(({ supplier, analytics }, index) => (
              <p key={supplier.id}><b>{index + 1}. {supplier.name}</b><br /><small>{formatCurrency(analytics.totalInvoices)} αγορές • Υπόλοιπο {formatCurrency(analytics.balance)}</small></p>
            ))
          )}
        </div>

        <div className="line">
          <h3>📦 Χαμηλό Stock</h3>
          {dashboardExtraStats.lowStockItems.length === 0 ? (
            <p>Δεν υπάρχουν υλικά με χαμηλό stock.</p>
          ) : (
            dashboardExtraStats.lowStockItems.map((item) => (
              <p key={item.id}><b>{item.item_name}</b><br /><small>Υπόλοιπο: {item.quantity || 0} • Ελάχιστο: {item.min_quantity || 0}</small></p>
            ))
          )}
        </div>

        <div className="line">
          <h3>⏰ Ληγμένες εργασίες</h3>
          {dashboardExtraStats.overdueTasksList.length === 0 ? (
            <p>Δεν υπάρχουν ληγμένες εργασίες.</p>
          ) : (
            dashboardExtraStats.overdueTasksList.map((task) => (
              <p key={task.id}><b>{task.title}</b><br /><small>{formatDate(task.task_date)} • {getProjectTitle(task.project_id)}</small></p>
            ))
          )}
        </div>
      </div>
    </TDCard>
  );
}

