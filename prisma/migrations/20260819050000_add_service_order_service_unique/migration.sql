-- CreateIndex
CREATE UNIQUE INDEX "ServiceOrderService_serviceOrderId_serviceId_key" ON "ServiceOrderService"("serviceOrderId", "serviceId");
