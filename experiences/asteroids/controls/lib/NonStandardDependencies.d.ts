declare module './NonStandardDependencies.es.js' {
  import * as React from 'react';
  import { SerializedStyles } from '@emotion/react';

  export interface PaginationProps {
    count: number;
    page: number;
    onChange: (_event: React.ChangeEvent<unknown>, page: number) => void;
    color: string;
    variant: string;
    css?: SerializedStyles;
  }

  const Pagination: React.ForwardRefExoticComponent<PaginationProps & React.RefAttributes<any>>;
  export { Pagination };
}
