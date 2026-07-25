/**
 * RestartState
 *
 * All states the KDOS restart lifecycle can occupy.
 */

export type RestartState = "Pending" | "Restarting" | "Completed" | "Failed";