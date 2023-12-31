import assert from "assert"
import "mocha"
import { Payment } from "../Payment"
import { PaymentCollection } from "./PaymentCollection"
import { Money } from "../Money"
import { Currency } from "../Currency"
import { PaymentId } from "./PaymentId"
import { Timestamp } from "../Timestamp"
import { PaymentAlreadyFoundError } from "./Error/PaymentAlreadyFoundError"
import * as E from "fp-ts/lib/Either"

describe("PaymentCollection", (): void => {
	const givenPayment = new Payment(
		new PaymentId("1"),
		new Timestamp(11),
		new Money(Currency.EUR, 111),
	)

	const anotherPayment = new Payment(
		new PaymentId("2"),
		new Timestamp(22),
		new Money(Currency.EUR, 222),
	)

	describe("contains", () => {
		it("must support empty collection", () => {
			const collection = new PaymentCollection([])

			assert.equal(collection.contains(givenPayment), false)
		})

		it("must support payment not found", () => {
			const collection = new PaymentCollection([givenPayment])

			assert.equal(collection.contains(anotherPayment), false)
		})

		it("must find payment in first position", () => {
			const collection = new PaymentCollection([
				givenPayment,
				anotherPayment,
			])

			assert.equal(collection.contains(givenPayment), true)
		})

		it("must find payment in last position", () => {
			const collection = new PaymentCollection([
				givenPayment,
				anotherPayment,
			])

			assert.equal(collection.contains(anotherPayment), true)
		})
	})

	describe("with", () => {
		it("must append to empty collection", () => {
			const collection = new PaymentCollection([])
			const result = collection.with(givenPayment)

			if (E.isLeft(result)) {
				throw result.left
			}

			assert.deepEqual(
				result.right.items(),
				new PaymentCollection([givenPayment]).items(),
			)
		})

		it("must append to non empty collection", () => {
			const collection = new PaymentCollection([givenPayment])
			const expected = new PaymentCollection([
				givenPayment,
				anotherPayment,
			])

			const result = collection.with(anotherPayment)

			if (E.isLeft(result)) {
				throw result.left
			}

			assert.deepEqual(result.right.items(), expected.items())
		})

		it("must fail to append already found payment", () => {
			const collection = new PaymentCollection([givenPayment])
			const result = collection.with(givenPayment)

			if (E.isRight(result)) {
				throw new Error("Expected PaymentAlreadyFoundError")
			}

			assert.deepEqual(
				result.left,
				new PaymentAlreadyFoundError(givenPayment.id),
			)
		})
	})

	interface ScenarioToTestTotal {
		name: string
		collection: PaymentCollection
		expected: number
	}

	const scenariosToTestTotal: ScenarioToTestTotal[] = [
		{
			name: "empty collection",
			collection: new PaymentCollection([]),
			expected: 0,
		},
		{
			name: "single payment",
			collection: new PaymentCollection([givenPayment]),
			expected: givenPayment.amount.cents,
		},
		{
			name: "multiple payments",
			collection: new PaymentCollection([givenPayment, anotherPayment]),
			expected: givenPayment.amount.cents + anotherPayment.amount.cents,
		},
	]

	scenariosToTestTotal.forEach((scenario: ScenarioToTestTotal) => {
		it(`total: ${scenario.name}`, (): void => {
			const actual = scenario.collection.total()

			assert.equal(actual, scenario.expected)
		})
	})
})
