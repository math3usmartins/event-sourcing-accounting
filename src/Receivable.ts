import { type ReceivableId } from "./Receivable/ReceivableId"
import { type CustomerAccountId } from "./CustomerAccount/CustomerAccountId"
import { type Timestamp } from "./Timestamp"
import { type ReceivablePaymentCollection } from "./Receivable/Payment/ReceivablePaymentCollection"
import { type Money } from "./Money"
import { type ReceivablePayment } from "./Receivable/Payment/ReceivablePayment"
import { type Mutation } from "./Mutation"
import { type PaymentAllocatedToReceivable } from "./Receivable/Event/PaymentAllocatedToReceivable"
import { type ReceivableEvent } from "./Receivable/Event/ReceivableEvent"
import { type Either } from "fp-ts/lib/Either"

export interface Receivable<Type> {
	id: ReceivableId
	dateTime: Timestamp
	customerAccountId: CustomerAccountId
	amount: Money
	payments: ReceivablePaymentCollection
	isPaid: () => boolean
	isWrittenOff: () => boolean
	pendingAmount: () => Money
	allocatePayment: (
		payment: ReceivablePayment,
	) => Mutation<Type, PaymentAllocatedToReceivable>

	onEvent: (event: ReceivableEvent) => Either<Error, Receivable<Type>>
}
