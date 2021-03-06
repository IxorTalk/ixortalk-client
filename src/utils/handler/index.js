// @flow
export type Subscription = {|
  remove: () => void,
|}
type HandlerCallback<Arg> = Arg => any
type HandlerAddOpts = { emitCurrent?: boolean }
export interface Handler<Arg> {
  trigger(Arg): void;
  triggerError(Error): void;
  add(HandlerCallback<Arg>, ?HandlerAddOpts): Subscription;
}

const createHandler = <Value>(initialValue: Value): Handler<Value> => {
  let lastValue: Value = initialValue
  let nextId = 0
  let _id = Math.random()
  const handlers = {}

  const add = (callback: HandlerCallback<Value>, opts?: ?HandlerAddOpts) => {
    const id = nextId
    handlers[id] = callback
    const subscription = {
      remove() {
        delete handlers[id]
      },
    }
    nextId++
    if (opts && opts.emitCurrent && lastValue !== undefined) callback(lastValue)
    else if (opts && opts.emitCurrent && lastValue === undefined)
      console.warn(
        'Could not emit current since last value was still undefined.',
      )

    return subscription
  }
  const trigger = (value: Value) => {
    const fnArr = Object.keys(handlers)
      .map(k => handlers[k])
      .forEach(fn => fn(value))
    lastValue = value
  }
  const triggerError = (error: Error) => {
    const fnArr = Object.keys(handlers)
      .map(k => handlers[k])
      .forEach(fn => fn(null, error))
  }

  return {
    trigger,
    triggerError,
    add,
  }
}

export { createHandler }
