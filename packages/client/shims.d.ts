import {AttributifyAttributes} from 'windicss/types/jsx';
import {Form} from '@felte/solid';

declare module 'solid-js' {
  namespace JSX {
    interface HTMLAttributes<T> extends AttributifyAttributes {
      // Object?: string;
    }
    interface SvgSVGAttributes<T> extends AttributifyAttributes {}
    interface IntrinsicAttributes extends AttributifyAttributes {}

    interface Directives {
      form: Form<any>['form'];
    }
  }
}
