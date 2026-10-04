              <div className="quick-create-backdrop no-print" onClick={() => setQuickCreateOpen(false)} />
              <aside className="quick-create-panel no-print" aria-label="Γρήγορη νέα καταχώριση">
                <h2 className="quick-create-title">➕ Νέα Καταχώριση</h2>
                <p className="quick-create-subtitle">Διάλεξε τι θέλεις να καταχωρήσεις.</p>

                <button
                  className="quick-create-option dial-customer"
                  onClick={() => goToQuickCreate('customers', () => {
                    setNewCustomer(INITIAL_CUSTOMER);
                    setEditingCustomerId(null);
                  })}
                >
                  <span className="dial-label">Νέος Πελάτης</span>
                  <span className="dial-icon">👤</span>
                </button>

                <button
                  className="quick-create-option dial-project"
                  onClick={() => goToQuickCreate('customers', () => {
                    setNewProject(INITIAL_PROJECT);
                    setEditingProjectId(null);
                  })}
                >
                  <span className="dial-label">Νέο Έργο</span>
                  <span className="dial-icon">🏗️</span>
                </button>

                <button
                  className="quick-create-option dial-invoice"
                  onClick={() => goToQuickCreate('customer-invoices', () => {
                    setNewCustomerInvoice(INITIAL_CUSTOMER_INVOICE);
                    setEditingCustomerInvoiceId(null);
                  })}
                >
                  <span className="dial-label">Τιμολόγιο Πελάτη</span>
                  <span className="dial-icon">🧾</span>
                </button>

                <button
                  className="quick-create-option dial-payment"
                  onClick={() => goToQuickCreate('finance', () => {
                    setNewPayment(INITIAL_PAYMENT);
                    setEditingPaymentId(null);
                    setShowPayments(true);
                  })}
                >
                  <span className="dial-label">Νέα Είσπραξη</span>
                  <span className="dial-icon">💰</span>
                </button>

                <button
                  className="quick-create-option dial-supplier-invoice"
                  onClick={() => goToQuickCreate('suppliers', () => {
                    setNewSupplierInvoice(INITIAL_SUPPLIER_INVOICE);
                    setEditingSupplierInvoiceId(null);
                    setOpenSupplierId(null);
                  })}
                >
                  <span className="dial-label">Τιμολόγιο Προμηθευτή</span>
                  <span className="dial-icon">🚚</span>
                </button>

                <button
                  className="quick-create-option dial-supplier-payment"
                  onClick={() => goToQuickCreate('suppliers', () => {
                    setNewSupplierPayment(INITIAL_SUPPLIER_PAYMENT);
                    setEditingSupplierPaymentId(null);
                    setOpenSupplierId(null);
                  })}
                >
                  <span className="dial-label">Πληρωμή Προμηθευτή</span>
                  <span className="dial-icon">💳</span>
                </button>

                <button
                  className="quick-create-option dial-inventory"
                  onClick={() => goToQuickCreate('inventory', () => {
                    setNewInventory(INITIAL_INVENTORY);
                    setEditingInventoryId(null);
                    setOpenInventoryItemId(null);
                  })}
                >
                  <span className="dial-label">Νέο Υλικό</span>
                  <span className="dial-icon">📦</span>
                </button>

                <hr />
                <small>Πάτα ξανά το + για κλείσιμο.</small>
              </aside>
            </>
          )}

          <button
            className={quickCreateOpen ? 'quick-create-fab open no-print' : 'quick-create-fab no-print'}
            onClick={() => setQuickCreateOpen(!quickCreateOpen)}
            aria-label="Νέα καταχώριση"
          >
            +
          </button>
        </>
      )}

    </main>
  );
}
