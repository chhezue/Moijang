import styled from "styled-components";

export const Container = styled.div`
  width: 80%;
  min-width: 800px;
  max-width: 1200px;
  margin: 0 auto;
  padding-top: 30px;

  @media (max-width: 900px) {
    width: 90%;
    min-width: 0;
  }
`;
