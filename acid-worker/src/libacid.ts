/**
 * libacid is the client-facing library for Acid.
 *
 * Objects in this library are available to `acid.js` scripts.
 */

/** */

import * as jobImpl from "./job"
import * as groupImpl from "./group"
import * as eventsImpl from "./events"
import {JobRunner} from "./k8s"

// These are filled by the 'fire' event handler.
let currentEvent = null
let currentProject = null

/**
 * events is the main event registry.
 *
 * New event handlers can be registered using `events.on(name: string, (e: AcidEvent, p: Project) => {})`.
 * where the `name` is the event name, and the callback is the function to be
 * executed when the event is triggered.
 */
export let events = new eventsImpl.EventRegistry()

/**
 * fire triggers an event.
 *
 * The fire() function takes an AcidEvent (the event to be triggered) and a
 * Project (the owner project). If an event handler is found, it is executed.
 * If no event handler is found, nothing happens.
 */
export function fire(e: eventsImpl.AcidEvent, p: eventsImpl.Project) {
  currentEvent = e
  currentProject = p
  events.fire(e, p)
}

/**
 * Job describes a particular job.
 *
 * A Job always has a name and an image. The name is used to reference this
 * job in relation to other jobs in the same event. The image corresponds to a
 * container image that will be executed as part of this job.
 *
 * A Job may also have one or more tasks associated with it. Tasks are run
 * (in order) inside of the image. When no tasks are supplied, the image is
 * executed as-is.
 */
export class Job extends jobImpl.Job{
  run(): Promise<jobImpl.Result> {
    let jr = new JobRunner(this, currentEvent, currentProject)
    this._podName = jr.name
    return jr.run().catch(err => {
      // Wrap the message to give clear context.
      let msg = `job ${ this.name }(${ jr.name }): ${ err }`
      return Promise.reject(msg)
    })
  }
}

/**
 * Group describes a collection of associated jobs.
 *
 * A group of jobs can be executed in two ways:
 *   - In parallel as runAll()
 *   - In serial as runEach()
 */
export class Group extends groupImpl.Group {
  // This seems to be how you expose an existing class as an export.
}

