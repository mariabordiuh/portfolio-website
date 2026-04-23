import {
  Link,
  type LinkProps,
} from 'react-router-dom';
import { prefetchRoute } from '../utils/route-prefetch';

type PrefetchLinkProps = LinkProps & {
  prefetchTo?: string;
};

export const PrefetchLink = ({ to, prefetchTo, onFocus, onMouseEnter, ...props }: PrefetchLinkProps) => {
  const target = prefetchTo ?? (typeof to === 'string' ? to : to.pathname ?? '');

  const handlePrefetch = () => {
    if (target) {
      prefetchRoute(target);
    }
  };

  return (
    <Link
      to={to}
      onFocus={(event) => {
        handlePrefetch();
        onFocus?.(event);
      }}
      onMouseEnter={(event) => {
        handlePrefetch();
        onMouseEnter?.(event);
      }}
      {...props}
    />
  );
};
