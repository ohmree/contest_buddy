import {Component} from 'solid-js';
import {useParams} from 'solid-app-router';

const Contest: Component = () => {
  const parameters = useParams();
  return (
    <>
      <h1 text="center gray-700 capitalize dark:gray-200 md:lg">WIP</h1>
      <p text="center gray-700 capitalize dark:gray-200 md:lg">
        Contest {parameters['id']}
      </p>
    </>
  );
};

export default Contest;
