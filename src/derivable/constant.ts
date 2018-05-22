import { Derivable } from './derivable';

/**
 * Constant represents a basic immutable building block of derivations.
 */
export class Constant<V> extends Derivable<V> {
    /**
     * Creates a new Constant with the give value.
     *
     * @param value the readonly value of this Constant
     */
    constructor(
        /**
         * @internal
         * The readonly value of this Constant.
         */
        readonly value: V,
    ) {
        super();
    }

    /**
     * @internal
     * The version of this Constant, should always stay at 0, because Constants never change.
     */
    readonly version = 0;

    /**
     * Returns the value of this Constant.
     */
    get(): V { return this.value; }
}

/**
 * Creates a new Constant with the give value.
 *
 * @param value the immutable value of this Constant
 */
export function constant<V>(value: V): Constant<V> {
    return new Constant(value);
}
