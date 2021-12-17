import React, { useEffect, useState } from "react";
import { Alert, Card, Col, Row } from "react-bootstrap";
import { API } from "../api";
import { NeuroServiceMatching } from "../neuroservice";

function useNeuroImagesSegment(
  api: API<NeuroServiceMatching>,
  ipcl: string,
  ipcr: string
) {
  const [images, setImages] = useState<
    Extract<NeuroServiceMatching, { type: "segment" }>["response"]
  >();

  useEffect(() => {
    const image_upd = setInterval(async () => {
      try {
        const value = await api.getByAPI_get("segment", {
          ipcl: ipcl,
          ipcr: ipcr,
          last_req: "",
        });
        setImages(value);
      } catch (e) {
        console.log("service not found");
      }
    }, 1000);
    return () => {
      clearInterval(image_upd);
    };
  }, [api, ipcl, ipcr]);

  return images;
}

function useNeuroImagesClass(
  api: API<NeuroServiceMatching>,
  ipcl: string,
  ipcr: string
) {
  const [images, setImages] = useState<
    Extract<NeuroServiceMatching, { type: "class" }>["response"]
  >();

  useEffect(() => {
    const image_upd = setInterval(() => {
      api
        .getByAPI_get("class", {
          ipcl: ipcl,
          ipcr: ipcr,
          last_req: "",
        })
        .then((value) => setImages(value))
        .catch((reason) => {
          console.log(reason);
        });
    }, 1000);
    return () => {
      clearInterval(image_upd);
    };
  }, [api, ipcl, ipcr]);

  return images;
}

function PredictCard({
  neuro,
  name,
}: {
  name: string;
  neuro: {
    image: { source?: string; predict?: string };
    time?: string;
    predict: { segment?: "NG" | "OK"; class?: "NG" | "OK" };
    text?: string;
  };
}) {
  return (
    <Card
      bg={neuro.predict.segment === "NG" ? "danger " : "success"}
      text={"white"}
    >
      <Card.Header>
        {name} cam at {neuro.time}
      </Card.Header>
      <Card.Img
        variant="top"
        src={`http://localhost:8090/jpg/${neuro.image.source}`}
      />
      <Card.Img
        variant="top"
        src={`http://localhost:8090/jpg/${neuro.image.predict}`}
      />
      <Card.Body>
        <Card.Title>
          Segment: {neuro.predict.segment} | Class: {neuro.predict.class}
        </Card.Title>
        <Card.Text>{neuro.text}</Card.Text>
      </Card.Body>
    </Card>
  );
}

function NeuroImage({
  ipcl,
  ipcr,
  port = 8090,
}: {
  ipcl: string;
  ipcr: string;
  port: number;
}) {
  // eslint-disable-next-line
  const [api, setApi] = useState<API<NeuroServiceMatching>>(
    () => new API<NeuroServiceMatching>("http://localhost", port)
  );
  const by_class = useNeuroImagesClass(api, ipcl, ipcr);
  const by_segment = useNeuroImagesSegment(api, ipcl, ipcr);
  return (
    <Alert>
      <Row>
        <Col>
          <PredictCard
            name="Left"
            neuro={{
              image: {
                predict: by_segment?.RESULT.predict_image_L,
                source: by_segment?.PATH.image_L,
              },
              predict: {
                class: by_class?.RESULT.labels[0],
                segment: by_segment?.RESULT.predict_L,
              },
              text: by_segment?.RESULT.text_L,
              time: by_segment?.TIMING.response,
            }}
          />
        </Col>
        <Col>
          <PredictCard
            name="Right"
            neuro={{
              image: {
                predict: by_segment?.RESULT.predict_image_R,
                source: by_segment?.PATH.image_R,
              },
              predict: {
                class: by_class?.RESULT.labels[1],
                segment: by_segment?.RESULT.predict_R,
              },
              text: by_segment?.RESULT.text_R,
              time: by_segment?.TIMING.response,
            }}
          />
        </Col>
        <Col xs={7}></Col>
      </Row>
    </Alert>
  );
}
export default NeuroImage;
