-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrderStockItem_serviceOrderId_stockItemId_key" ON "ServiceOrderStockItem"("serviceOrderId", "stockItemId");
