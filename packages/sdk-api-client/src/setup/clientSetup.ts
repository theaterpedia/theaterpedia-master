
import { ApolloClient, ApolloLink, InMemoryCache, createHttpLink } from '@apollo/client';
import { onError } from "@apollo/client/link/error";
import { MiddlewareConfig } from '../index';
import logBuilder from './logBuilder'

import fetch from 'cross-fetch';

const buildClient = (settings: MiddlewareConfig) => {


  const httpLink = createHttpLink({
    uri: settings.odooGraphqlUrl,
    credentials: 'include',
    fetch,
    fetchOptions: settings.fetchOptions,
    headers: {
      Cookie: settings.sessionAuth,
      'resquest-host': settings.requestHost,
      'REAL-IP': settings.realIp
    }
  });

  const afterwareLink = new ApolloLink((operation, forward) => {
    return forward(operation).map((response) => {
      const context = operation.getContext();
      const authHeader = context.response.headers.get('set-cookie');

      if (response.data) {
        response.data.cookie = authHeader;
      }

      return response;
    });
  });

  const apolloLink = ApolloLink.from([
    afterwareLink.concat(httpLink)
  ]);

  return new ApolloClient({
    link: apolloLink,
    cache: new InMemoryCache(),
    ssrMode: true,
    credentials: 'include',
    defaultOptions: {
      query: {
        errorPolicy: "all",
        fetchPolicy: "no-cache",
      },
      mutate: {
        errorPolicy: "all",
      }
    }
  });
};

export default buildClient;
