import { type CustomerAccountId } from "./CustomerAccount/CustomerAccountId"
import { ReceivableCollection } from "./Receivable/ReceivableCollection"
import { type Receivable } from "./Receivable"
import { type Payment } from "./Payment"
import { type Timestamp } from "./Timestamp"
import { PaymentCollection } from "./Payment/PaymentCollection"
import { AggregateCommandOutput } from "./AggregateCommandOutput"
import { PaymentAddedToCustomerAccount } from "./CustomerAccount/Event/PaymentAddedToCustomerAccount"
import { ReceivableAddedToCustomerAccount } from "./CustomerAccount/Event/ReceivableAddedToCustomerAccount"
import { type CustomerAccountEvent } from "./CustomerAccount/CustomerAccountEvent"
import { type Invoice } from "./Receivable/Invoice"

type CustomerAccountAggregateCommandOutput = AggregateCommandOutput<CustomerAccount, CustomerAccountEvent>

export class CustomerAccount {
	constructor(
		public readonly id: CustomerAccountId,
		private readonly receivables: ReceivableCollection<Invoice>,
		private readonly payments: PaymentCollection,
	) {}

	public static fromEvents(id: CustomerAccountId, events: CustomerAccountEvent[]): CustomerAccount {
		return events.reduce(
			(account: CustomerAccount, event: CustomerAccountEvent) => {
				if (event instanceof PaymentAddedToCustomerAccount) {
					return account.allocatePayment(event.payment).aggregate
				}

				if (event instanceof ReceivableAddedToCustomerAccount) {
					return account.allocateReceivable(event.receivable, event.dateTime).aggregate
				}

				throw new Error("Event not supported" + event.constructor.name)
			},
			new CustomerAccount(id, new ReceivableCollection(id, []), new PaymentCollection([])),
		)
	}

	public allocateReceivable(
		receivable: Receivable<Invoice>,
		dateTime: Timestamp,
	): CustomerAccountAggregateCommandOutput {
		const customerWithReceivable = new CustomerAccount(this.id, this.receivables.with(receivable), this.payments)

		const allocateAvailablePayments = customerWithReceivable.allocateAvailablePayments(dateTime)

		return new AggregateCommandOutput(allocateAvailablePayments.aggregate, [
			new ReceivableAddedToCustomerAccount(receivable, this.id, dateTime),
			...allocateAvailablePayments.events,
		])
	}

	public allocatePayment(payment: Payment): CustomerAccountAggregateCommandOutput {
		const payments = this.payments.with(payment)
		const receivablesAllocation = this.receivables.allocatePayment(payment)

		return new AggregateCommandOutput(new CustomerAccount(this.id, receivablesAllocation.aggregate, payments), [
			new PaymentAddedToCustomerAccount(payment, this.id, payment.dateTime),
			...receivablesAllocation.events,
		])
	}

	private allocateAvailablePayments(dateTime: Timestamp): CustomerAccountAggregateCommandOutput {
		return this.payments.items().reduce(
			(carry: CustomerAccountAggregateCommandOutput, payment: Payment) => {
				const receivablesAllocationOutput = carry.aggregate.receivables.allocatePayment(payment)

				const customerWithAllocatedPayments = new CustomerAccount(
					this.id,
					receivablesAllocationOutput.aggregate,
					this.payments,
				)

				return new AggregateCommandOutput(customerWithAllocatedPayments, [
					...carry.events,
					...receivablesAllocationOutput.events,
				])
			},
			new AggregateCommandOutput(this, []),
		)
	}
}
