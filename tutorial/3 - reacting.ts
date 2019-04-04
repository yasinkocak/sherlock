import { expect } from 'chai';
import { atom } from '../src';

/**
 * In the intro we have seen a basic usage of the `.react()` method.
 * Let's dive a bit deeper into the details of this method.
 */
describe.skip('reacting', () => {
    // For easy testing we can count the number of times a reactor was called
    let wasCalledTimes = 0;
    // And record the last value it reacted to
    let lastValue: any;
    beforeEach('reset the values', () => {
        wasCalledTimes = 0;
        lastValue = undefined;
    });
    // The reactor to be given to the `.react()` method
    function reactor(val: any) {
        wasCalledTimes++;
        lastValue = val;
    }
    // Of course we are lazy and don't want to type these assertions over and over. :-)
    function expectReact(reactions: number, value?: any) {
        expect(wasCalledTimes, 'Reaction was called # times').to.equal(reactions);
        expect(lastValue, 'Last value of the reaction was #').to.equal(value);
    }

    /**
     * Every `Derivable` always has a current state. So the `.react()` method does not need to wait for a value, there already is one.
     * This means that `.react()` will fire directly when called.
     * When the `Derivable` has a new state, this will also fire `.react()` synchronously.
     * So the very next line after `.set()` is called, the `.react()` has already fired!
     *
     * (except when the `Derivable` is `unresolved` but more on that later)
     */
    it('reacting synchronously', () => {
        const myAtom$ = atom('initial value');
        // A trivial `expect` to silence TypeScript's noUnusedLocals
        expect(myAtom$.get()).to.equal('initial value');

        // There should not have been a reaction yet
        expectReact(0);

        /**
         * **Your Turn**
         * Time to react to `myAtom$` with the `reactor()` function defined above
         */

        expectReact(1, 'initial value');

        /** now set a 'new value' to `myAtom$` */

        expectReact(1, 'new value');
    });

    /**
     * A reactor will go on forever. This is often not what you want, and almost always a memory leak.
     *
     * So it is important to stop a reactor at some point. The `.react()` method has different ways of dealing with this.
     * The easiest is the `stopper()` function, every `.react()` call will return a function that will stop the reaction.
     */
    it('stopping a reaction', () => {
        const myAtom$ = atom('initial value');
        // A trivial `expect` to silence TypeScript's noUnusedLocals
        expect(myAtom$.get()).to.equal('initial value');

        /**
         * **Your Turn**
         * time to react to `myAtom$` with the `reactor()` function defined above
         * remember to catch the returned `stopper` in a variable
         */

        expectReact(1, 'initial value');

        /** call the stopper */

        myAtom$.set('new value');

        // And the reaction stopped.
        expectReact(1, 'initial value');
    });

    /**
     * The reactor `options` are a way to modify when and how the reactor will react to changes in the `Derivable`
     */
    describe('reactor options', () => {
        /**
         * Another way to make a reactor stop at a certain point is by specifying an `until` in the `options`.
         * `until` can be given either a `Derivable` or a `function`.
         * If a `Derivable` is given, the reaction will stop once that `Derivable` returns `true`/truthy.
         * If a `function` is given, this function will be given the `Derivable` that is the source of the reaction as a parameter.
         * This `function` will track any `.get()`s, so can use any `Derivable`. It can return a `boolean` or a `Derivable<boolean>`
         * *Note: the reactor options `when` and `from` can also be used as the `Derivable`/`function` above.*
         *
         * It will stop directly when `until` becomes true. Tf that happens at exactly the same time as a new value, it will not react again.
         */
        it('reacting `until`', () => {
            const until$ = atom(false);
            const myAtom$ = atom('initial value');
            expectReact(0);

            // We can do some fancy stuff in the `until`
            // In this case we stop if `until$` is true and `myAtom$` is filled
            myAtom$.react(reactor, { until: a => a && until$.get() });

            expectReact(1, 'initial value'); // As usual, it should react immediately

            myAtom$.set('');
            expectReact(2, ''); // It should keep reacting as usual

            until$.set(true);   // We set `until$` to true, but since `myAtom$` is falsy, it will not stop
            expectReact(2, ''); // There is no new value, though

            myAtom$.set('new value');   // Now we set `myAtom$`, which will set the `until` condition to true
            expectReact(2, '');         // The reactor has immediately stopped, so it still reacted only twice

            until$.set(false);          // Even when `until$` is set to false again
            expectReact(2, '');         // The reactor won't start up again.

            /**
             * **Your Turn**
             * Time to use `until$` directly in `until`. This does not need any `function` wrapper.
             */
            myAtom$.react(reactor, {  /** your turn */ });

            expectReact(3, 'new value');
            // As before, it should still react to 'normal' changes
            myAtom$.set('even newer value');
            expectReact(4, 'even newer value');

            until$.set(true);
            myAtom$.set('');
            expectReact(4, 'even newer value');  // The reactor should have stopped

            /**
             * **Your Turn**
             * Another often used method is returning the parent `Derivable` directly in the function. (as in `d => d`)
             * Try it!
             */
            myAtom$.react(reactor, {  /** your turn */ });
            expectReact(5, '');

            myAtom$.set('last value');
            expectReact(5, '');     // Setting a truthy value should have immediately stopped the reaction
        });

        /**
         * Sometimes you may not need to react to the first couple of values of the `Derivable`.
         * This can be because of the value of the `Derivable` or due to external conditions.
         * The `from` options is meant to help with this. It will only start the reactor after it becomes true.
         * Once it has become true, the reactor will not listen to this option anymore and react as usual.
         *
         * *Note: when using `from`, `.react()` will (most often) not reace synchronously anymore. As that is the function of this option.*
         */
        it('reacting `from`', () => {
            const sherlock$ = atom('');

            /**
             * **Your Turn**
             * We can react here, but restrict the reactions to start when the keyword 'dear' is set.
             * This will skip the first three reactions, but react as usual after that.
             *
             * *Hint: remember the `.is()` method?*
             */
            sherlock$.react(reactor, { /** your turn */ });

            expectReact(0);
            ['Elementary,', 'my', 'dear', 'Watson'].forEach(txt => sherlock$.set(txt));

            expectReact(2, 'Watson');
        });

        /**
         * Sometimes you may want to react only on certain values or when certain conditions are met.
         * It works exactly as `from`
         *
         * *Note: as with `from` this can prevent `.react()` from reacting synchronously*
         */
        it('reacting `when`', () => {
            const count$ = atom(0);

            /**
             * Now, let's react to all even numbers.
             * Except 4, we don't want to make it too easy now.
             */
            count$.react(reactor, { /** your turn */ });

            expectReact(1, 0);

            for (let i = 0; i <= 4; i++) {
                count$.set(i);
            }
            expectReact(2, 2);
            for (let i = 4; i <= 10; i++) {
                count$.set(i);
            }
            expectReact(5, 10);
        });

        /**
         * With `once` you can stop the reactor after it has emitted exactly one value. This is a `boolean` option.
         *
         * Without any other `options`, this is just a strange way of typing `.get()`. But when combined with `when` or `from`,
         * it can be very useful.
         */
        it('reacting `once`', () => {
            const finished$ = atom(false);

            /**
             * **Your Turn**
             * Say you want to react when `finished$` is true. It can not finish twice.
             */
            finished$.react(reactor, { /** your turn */ });
            expectReact(0);

            // When finished it should react once
            finished$.set(true);
            expectReact(1, true);

            // After that it should really be finished. :-)
            finished$.set(false);
            finished$.set(true);
            expectReact(1, true);
        });

        /**
         * Normally the reactor will immediately fire with the current value.
         * If you want the reactor to fire normally, just not the first time, there is also a `boolean` option: `skipFirst`.
         */
        it('reacting with `skipFirst`', () => {
            const done$ = atom(false);

            /**
             * **Your Turn**
             * Say you want to react when `done$` is true. But not right away..
             */
            done$.react(reactor, { /** your turn */ });
            expectReact(0);

            done$.set(true);
            expectReact(1, true);
        });
    });
});