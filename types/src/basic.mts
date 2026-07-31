/**
 * @module types/general
 * @description File with type guards for basic Typescript types.
 */

// TODO: this should probably go in a validators module

/**
 * Type guard for object
 * @param o Unknown object
 * @returns True if o is of type object
 */
export function isObject(o:unknown): o is object {
    return o !== null && typeof o === "object";
}

/**
 * Type guard for string type
 * @param value 
 * @returns  boolean
 */
export function isString(value: unknown, nonempty: boolean = false): value is string {
    if (nonempty) {
        return typeof value === "string" && value.length !== 0;
    }
    
    return typeof value === "string";
}
