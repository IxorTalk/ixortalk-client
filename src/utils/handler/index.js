// @flow
export type Subscription = {|
  remove: () => void,
|}
type HandlerCallback<Arg> = (Arg) => any
type HandlerAddOpts = {emitCurrent?: boolean}
export interface Handler<Arg> {
  trigger(Arg): void,
  add(HandlerCallback<Arg>, ?HandlerAddOpts): Subscription,
}

const createHandler = <Value>(initialValue: Value): Handler<Value> => {
  let lastValue: Value = initialValue
  let nextId = 0
  const handlers = {}
  
  const add = (callback: HandlerCallback<Value>, opts?: ?HandlerAddOpts) => {
    const id = nextId
    handlers[id] = callback
    const subscription = {
      remove() {
        delete handlers[id]
      }
    }
    nextId++
    
    if (opts && opts.emitCurrent)
      callback(lastValue)
      
    return subscription
  }
  const trigger = (value: Value) => {
    const fnArr = Object.keys(handlers)
      .map(k => handlers[k])
      .forEach(fn => fn(value))
    lastValue = value
  }
  
  return {
    trigger,
    add,
  }
}

export {createHandler}
